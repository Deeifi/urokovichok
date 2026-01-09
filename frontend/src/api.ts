import type { ScheduleRequest, ScheduleResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
