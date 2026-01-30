import type { ScheduleRequest, ScheduleResponse } from '../types';

export async function generateSchedule(data: ScheduleRequest): Promise<ScheduleResponse> {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        return result as ScheduleResponse;
    } catch (error) {
        console.error("Schedule generation failed:", error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : "Невідома помилка при з'єднанні з сервером"
        };
    }
}
