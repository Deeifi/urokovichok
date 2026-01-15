import { useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useScheduleStore } from '../store/useScheduleStore';

/**
 * Hook for managing and detecting schedule conflicts.
 * Centralizes logic previously scattered across multiple view components.
 */
export const useConflicts = () => {
    /** Classes data from central store */
    const classes = useDataStore(s => s.data.classes);
    /** Teachers data from central store */
    const teachers = useDataStore(s => s.data.teachers);
    /** Current schedule response from central store */
    const scheduleResponse = useScheduleStore(s => s.schedule);


    // Derived lessons array
    const lessons = (scheduleResponse?.status === 'success' || scheduleResponse?.status === 'conflict')
        ? scheduleResponse.schedule
        : [];

    /**
     * Checks for teacher conflicts at a specific time slot.
     * @param teacherId - UUID of the teacher to check
     * @param day - Target day (e.g., 'Mon')
     * @param period - Target period (0-7)
     * @param excludeClassId - Optional ID of a class to ignore (useful for move checks)
     * @returns Array of class names where this teacher is already occupied at the given time.
     */
    const getTeacherConflicts = useCallback((teacherId: string, day: string, period: number, excludeClassId?: string): string[] => {

        return lessons
            .filter(l =>
                l.teacher_id === teacherId &&
                l.day === day &&
                l.period === period &&
                l.class_id !== excludeClassId
            )
            .map(l => classes.find(c => c.id === l.class_id)?.name || '???');
    }, [lessons, classes]);

    /**
     * Checks for class conflicts at a specific time slot.
     * @param classId - UUID of the class to check
     * @param day - Target day (e.g., 'Mon')
     * @param period - Target period (0-7)
     * @param excludeTeacherId - Optional ID of a teacher to ignore (useful for swap checks)
     * @returns Array of teacher names assigned to this class at the given time.
     */

    const getClassConflicts = useCallback((classId: string, day: string, period: number, excludeTeacherId?: string): string[] => {

        return lessons
            .filter(l =>
                l.class_id === classId &&
                l.day === day &&
                l.period === period &&
                l.teacher_id !== excludeTeacherId
            )
            .map(l => teachers.find(t => t.id === l.teacher_id)?.name || '???');
    }, [lessons, teachers]);

    return { getTeacherConflicts, getClassConflicts };
};
