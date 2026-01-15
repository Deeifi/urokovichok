import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PerformanceSettings, ViewType } from '../types';

interface UIState {
    // Navigation
    activeTab: 'data' | 'schedule' | 'settings';
    setActiveTab: (tab: 'data' | 'schedule' | 'settings') => void;

    // View Settings
    viewType: ViewType;
    setViewType: (view: ViewType) => void;
    isCompact: boolean;
    setIsCompact: (compact: boolean | ((prev: boolean) => boolean)) => void;
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
    isFullScreen: boolean;
    setIsFullScreen: (full: boolean) => void;
    isHeaderCollapsed: boolean;
    setIsHeaderCollapsed: (collapsed: boolean) => void;
    isMonochrome: boolean;
    setIsMonochrome: (monochrome: boolean) => void;
    showIcons: boolean;
    setShowIcons: (show: boolean) => void;

    // Edit Mode
    isEditMode: boolean;
    setIsEditMode: (edit: boolean) => void;

    // Performance
    perfSettings: PerformanceSettings;
    setPerfSettings: (settings: PerformanceSettings | ((prev: PerformanceSettings) => PerformanceSettings)) => void;

    // User Role (RBAC)
    userRole: 'admin' | 'teacher';
    setUserRole: (role: 'admin' | 'teacher') => void;
    selectedTeacherId: string | null;
    setSelectedTeacherId: (id: string | null) => void;

    // Multi-select for Bulk Actions
    selectedLessonIds: string[];
    toggleSelectedLesson: (id: string) => void;
    clearSelection: () => void;
    setSelectedLessons: (ids: string[]) => void;
}

const DEFAULT_PERF_SETTINGS: PerformanceSettings = {
    disableAnimations: false,
    disableBlur: false,
    disableShadows: false,
    hidePhotos: false,
    lowFrequencyClock: false,
    disableHoverEffects: false,
};

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            activeTab: 'schedule',
            setActiveTab: (activeTab) => set({ activeTab }),

            viewType: 'dashboard',
            setViewType: (viewType) => set({ viewType }),

            isCompact: false,
            setIsCompact: (updater) => set((state) => ({ isCompact: typeof updater === 'function' ? updater(state.isCompact) : updater })),

            isSidebarCollapsed: false,
            setIsSidebarCollapsed: (updater) => set((state) => ({ isSidebarCollapsed: typeof updater === 'function' ? updater(state.isSidebarCollapsed) : updater })),

            isFullScreen: false,
            setIsFullScreen: (isFullScreen) => set({ isFullScreen }),

            isHeaderCollapsed: false,
            setIsHeaderCollapsed: (isHeaderCollapsed) => set({ isHeaderCollapsed }),

            isMonochrome: false,
            setIsMonochrome: (isMonochrome) => set({ isMonochrome }),

            showIcons: true,
            setShowIcons: (showIcons) => set({ showIcons }),

            isEditMode: false,
            setIsEditMode: (isEditMode) => set({ isEditMode }),

            perfSettings: DEFAULT_PERF_SETTINGS,
            setPerfSettings: (updater) => set((state) => {
                const newSettings = typeof updater === 'function' ? updater(state.perfSettings) : updater;
                // Apply global side effects
                document.body.setAttribute('data-perf-animations', (!newSettings.disableAnimations).toString());
                document.body.setAttribute('data-perf-blur', (!newSettings.disableBlur).toString());
                document.body.setAttribute('data-perf-shadows', (!newSettings.disableShadows).toString());
                return { perfSettings: newSettings };
            }),

            userRole: 'admin',
            setUserRole: (userRole) => set({ userRole }),

            selectedTeacherId: null,
            setSelectedTeacherId: (selectedTeacherId) => set({ selectedTeacherId }),

            selectedLessonIds: [],
            toggleSelectedLesson: (id) => set((state) => ({
                selectedLessonIds: state.selectedLessonIds.includes(id)
                    ? state.selectedLessonIds.filter(lid => lid !== id)
                    : [...state.selectedLessonIds, id]
            })),
            clearSelection: () => set({ selectedLessonIds: [] }),
            setSelectedLessons: (ids) => set({ selectedLessonIds: ids }),
        }),
        {
            name: 'school_os_ui_settings', // Merging multiple localKeys into one store for cleaner managment
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Persist only what we want to keep between sessions
                isCompact: state.isCompact,
                isSidebarCollapsed: state.isSidebarCollapsed,
                isMonochrome: state.isMonochrome,
                showIcons: state.showIcons,
                perfSettings: state.perfSettings,
                // userRole: state.userRole (maybe?)
            }),
        }
    )
);
