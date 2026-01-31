import type { ScheduleRequest, ScheduleResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

export const generateSchedule = async (data: ScheduleRequest): Promise<ScheduleResponse> => {
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                status: 'error',
                message: errorData.detail || 'Failed to generate schedule',
            };
        }

        return await response.json();
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

export const generateScheduleStream = async (
    data: ScheduleRequest,
    onProgress: (progress: number, message: string) => void
): Promise<ScheduleResponse> => {
    try {
        const response = await fetch(`${API_URL}/generate-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate schedule');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream not supported');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const json = JSON.parse(line.substring(6));
                    if (json.type === 'progress') {
                        onProgress(json.progress, json.message);
                    } else if (json.type === 'result') {
                        return json.data;
                    } else if (json.type === 'error') {
                        throw new Error(json.message);
                    }
                }
            }
        }
        throw new Error('Stream closed unexpectedly');
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
