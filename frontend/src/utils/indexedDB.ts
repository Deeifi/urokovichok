import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'school_scheduler_db';
const STORE_NAME = 'key_value_store';
const VERSION = 1;

/**
 * Custom IndexedDB wrapper implementing Zustand's StateStorage interface
 */
export const indexedDBStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const db = await openDB();
        let value = await new Promise<string | null>((resolve) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(name);

            request.onerror = () => {
                console.error(`Error getting item ${name} from IndexedDB`);
                resolve(null);
            };

            request.onsuccess = () => {
                resolve(request.result?.value ?? null);
            };
        });

        // Eager Migration: If not in IDB, check LocalStorage
        if (!value) {
            const localValue = localStorage.getItem(name);
            if (localValue) {
                console.log(`[Storage] Migrating ${name} from LocalStorage to IndexedDB`);
                value = localValue;
                // Save to IDB asynchronously
                // We typically need to "await" this if we want to be sure it's saved, 
                // but for "getItem" return speed, we can fire and forget or await.
                // Since this is a Promise returning function, let's await to be safe.
                try {
                    await indexedDBStorage.setItem!(name, localValue);
                    // Clear from LocalStorage to complete migration
                    localStorage.removeItem(name);
                } catch (e) {
                    console.error('Migration failed', e);
                }
            }
        }

        return value;
    },

    setItem: async (name: string, value: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ key: name, value });

            request.onerror = () => {
                console.error(`Error setting item ${name} in IndexedDB`);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    },

    removeItem: async (name: string): Promise<void> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(name);

            request.onerror = () => {
                console.error(`Error removing item ${name} from IndexedDB`);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    },
};

// Helper to open DB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
}

/**
 * Helper to get all data for backup
 */
export async function getAllData(): Promise<Record<string, any>> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const result: Record<string, any> = {};
            request.result.forEach((item: { key: string, value: string }) => {
                try {
                    result[item.key] = JSON.parse(item.value);
                } catch (e) {
                    result[item.key] = item.value;
                }
            });
            resolve(result);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Helper to restore data from backup
 */
export async function restoreData(data: Record<string, any>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Clear existing Store
        store.clear();

        let completed = 0;
        const total = Object.keys(data).length;

        if (total === 0) {
            resolve();
            return;
        }

        Object.entries(data).forEach(([key, value]) => {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const request = store.put({ key, value: stringValue });

            request.onsuccess = () => {
                completed++;
                if (completed === total) resolve();
            };
            request.onerror = () => reject(request.error);
        });
    });
}
