import { useState, useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useConflicts } from './useConflicts';
import type { Lesson, ScheduleResponse } from '../types';

/**
 * Hook for managing interactive schedule operations:
 * - Direct lesson editing/saving
 * - Drag and drop processing (Class and Teacher views)
 * - Conflict detection during interactions
 * - Confirmation orchestration for swaps and move conflicts
 */
export const useScheduleOperations = (
    /** Current schedule data object */
    schedule: ScheduleResponse | null,
    /** Callback to persist schedule modifications */
    onScheduleChange: (s: ScheduleResponse) => void
) => {

    const subjects = useDataStore(s => s.data.subjects);
    const teachers = useDataStore(s => s.data.teachers);
    const classes = useDataStore(s => s.data.classes);

    const { getTeacherConflicts } = useConflicts();

    // --- Interaction States ---
    const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{
        classId?: string,
        teacherId?: string,
        day: string,
        period: number
    } | null>(null);

    const [dragConfirm, setDragConfirm] = useState<{
        type: 'swap' | 'move' | 'copy';
        source: Lesson;
        target: {
            classId?: string,
            teacherId?: string,
            day: string,
            period: number,
            lesson?: Lesson | null,
            lessons?: Lesson[]
        };
        conflicts: string[];
        isCopy?: boolean; // New flag for Alt+Drag
    } | null>(null);

    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];

    /**
     * Creates or updates a lesson at the specified location.
     * 
     * @param classId - UUID of the class receiving the lesson
     * @param day - Target day ('Mon', 'Tue', etc.)
     * @param period - Target period (0-7)
     * @param subjectId - UUID of the subject
     * @param teacherId - UUID of the teacher
     * @param room - Optional room Override
     */
    const handleSaveLesson = useCallback((classId: string, day: string, period: number, subjectId: string, teacherId: string, room?: string) => {

        let updatedLessons = [...lessons];

        // Remove existing lesson at this specific cell
        updatedLessons = updatedLessons.filter(l =>
            !(l.class_id === classId && l.day === day && l.period === period)
        );

        if (subjectId && teacherId) {
            updatedLessons.push({
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacherId,
                day,
                period,
                room: room || undefined
            });
        }

        const newResponse: ScheduleResponse = schedule?.status === 'conflict'
            ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
            : { status: 'success', schedule: updatedLessons };

        onScheduleChange(newResponse);
    }, [lessons, schedule, onScheduleChange]);

    /**
     * Finalizes a drag-and-drop action after confirmation.
     */
    const executeDragAction = useCallback(() => {
        if (!dragConfirm) return;
        const { source, target, isCopy } = dragConfirm;
        let updatedLessons = [...lessons];

        // 1. Remove source from its original position (ONLY IF NOT COPYING)
        if (!source.isUnscheduled && !isCopy) {
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === source.class_id && l.day === source.day && l.period === source.period)
            );
        }

        // 2. Handle Swap: move the target lesson to the source's old position
        // SWAP IS NOT ALLOWED DURING COPY (Override behavior or disable swap for copy?)
        // If copying onto an existing lesson, we probably want to OVERWRITE or ERROR, not SWAP.
        // Let's assume Copy -> Overwrite (delete target). Swap with copy feels weird (cloning into two places?).
        // For now: if isCopy, we treat it as "Move target out? No, just overwrite". 
        // Actually, let's keep it simple: if Copying onto existing, we overwrite (delete target).
        // OR better: Block swap if copy?
        // Let's stick to standard behavior: If target exists, we overwrite it with the copy.
        if (dragConfirm.type === 'swap' && !isCopy) {
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === target.classId && l.day === target.day && l.period === target.period)
            );
            if (target.lesson) {
                updatedLessons.push({
                    ...target.lesson,
                    teacher_id: source.teacher_id,
                    day: source.day,
                    period: source.period
                });
            }
        } else if (target.lesson) {
            // If target exists and we are copying/moving (but not swapping), we remove target (overwrite)
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === target.classId && l.day === target.day && l.period === target.period)
            );
        }

        // 3. Add the source lesson at the target position
        // If it's a copy, we generate a NEW entry.
        updatedLessons.push({
            ...source,
            class_id: target.classId || source.class_id,
            teacher_id: target.teacherId || source.teacher_id,
            day: target.day,
            period: target.period,
            room: (target.teacherId && target.teacherId !== source.teacher_id)
                ? (subjects.find(s => s.id === source.subject_id)?.defaultRoom || source.room)
                : (source.room || subjects.find(s => s.id === source.subject_id)?.defaultRoom)
        });

        const newResponse: ScheduleResponse = schedule?.status === 'conflict'
            ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
            : { status: 'success', schedule: updatedLessons };

        onScheduleChange(newResponse);
        setDragConfirm(null);
        setDraggedLesson(null);
    }, [dragConfirm, lessons, subjects, onScheduleChange, schedule]);

    /**
     * Entry point for drag-and-drop on the Matrix/Class views.
     */
    const processDrop = useCallback((targetClassId: string, targetDay: string, targetPeriod: number, externalLesson?: any, isCopy: boolean = false) => {

        const sourceLesson = externalLesson || draggedLesson;
        if (!sourceLesson) return;

        // Prevent dropping on itself (unless copy? Copying to same slot does nothing)
        if (!sourceLesson.isUnscheduled && sourceLesson.class_id === targetClassId && sourceLesson.day === targetDay && sourceLesson.period === targetPeriod) {
            return;
        }

        const targetLesson = lessons.find(l => l.class_id === targetClassId && l.day === targetDay && l.period === targetPeriod);
        const conflicts: string[] = [];

        // Check if source teacher becomes busy
        // If copying, the teacher is ALREADY busy at the source time.
        // We need to check if they are busy at the TARGET time.
        // getTeacherConflicts checks target time.
        const sourceTeacherBusy = getTeacherConflicts(sourceLesson.teacher_id, targetDay, targetPeriod, targetClassId);
        if (sourceTeacherBusy.length > 0) {
            const teacherName = teachers.find(t => t.id === sourceLesson.teacher_id)?.name;
            conflicts.push(`${teacherName} вже має урок у ${sourceTeacherBusy.join(', ')} `);
        }

        // If target exists, we normally check swap conflicts.
        // But if copying, we don't swap, we overwrite. So we skip swap conflict check.
        if (targetLesson && !sourceLesson.isUnscheduled && !isCopy) {
            // For swap, check if target teacher becomes busy at source position
            const targetTeacherBusy = getTeacherConflicts(targetLesson.teacher_id, sourceLesson.day, sourceLesson.period, targetClassId);
            if (targetTeacherBusy.length > 0) {
                const teacherName = teachers.find(t => t.id === targetLesson.teacher_id)?.name;
                conflicts.push(`${teacherName} вже має урок у ${targetTeacherBusy.join(', ')} `);
            }
        }

        // If swap/conflict or move from unscheduled -> confirm
        if (targetLesson || conflicts.length > 0 || sourceLesson.isUnscheduled || isCopy) {
            setDragConfirm({
                type: (targetLesson && !sourceLesson.isUnscheduled && !isCopy) ? 'swap' : (isCopy ? 'copy' : 'move'),
                source: sourceLesson,
                target: { classId: targetClassId, day: targetDay, period: targetPeriod, lesson: targetLesson },
                conflicts,
                isCopy
            });
        } else {
            // Direct move
            let updatedLessons = [...lessons];
            if (!sourceLesson.isUnscheduled && !isCopy) {
                updatedLessons = updatedLessons.filter(l =>
                    !(l.class_id === sourceLesson.class_id && l.day === sourceLesson.day && l.period === sourceLesson.period)
                );
            }

            const subject = subjects.find(s => s.id === sourceLesson.subject_id);
            updatedLessons.push({
                ...sourceLesson,
                class_id: targetClassId,
                day: targetDay,
                period: targetPeriod,
                room: sourceLesson.room || subject?.defaultRoom
            });

            const newResponse: ScheduleResponse = schedule?.status === 'conflict'
                ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
                : { status: 'success', schedule: updatedLessons };

            onScheduleChange(newResponse);
            setDraggedLesson(null);
        }
        setDragOverCell(null);
    }, [draggedLesson, lessons, teachers, subjects, getTeacherConflicts, schedule, onScheduleChange]);

    /**
     * Entry point for drag-and-drop on the Teacher view.
     */
    const processTeacherDrop = useCallback((targetTeacherId: string, targetDay: string, targetPeriod: number, externalLesson?: any, isCopy: boolean = false) => {

        const sourceLesson = externalLesson || draggedLesson;
        if (!sourceLesson) return;

        if (!sourceLesson.isUnscheduled && sourceLesson.teacher_id === targetTeacherId && sourceLesson.day === targetDay && sourceLesson.period === targetPeriod) {
            return;
        }

        const targetLessons = lessons.filter(l => l.teacher_id === targetTeacherId && l.day === targetDay && l.period === targetPeriod);
        const conflicts: string[] = [];

        // In teacher view, we check if the TARGET teacher's class becomes busy
        const classBusy = getTeacherConflicts(targetTeacherId, targetDay, targetPeriod, sourceLesson.class_id);
        if (classBusy.length > 0) {
            const className = classes.find(c => c.id === sourceLesson.class_id)?.name;
            conflicts.push(`Клас ${className} вже має урок у ${classBusy.join(', ')} `);
        }

        setDragConfirm({
            type: isCopy ? 'copy' : 'move',
            source: sourceLesson,
            target: {
                teacherId: targetTeacherId,
                day: targetDay,
                period: targetPeriod,
                lessons: targetLessons
            },
            conflicts,
            isCopy
        });

        setDragOverCell(null);
    }, [draggedLesson, classes, getTeacherConflicts, lessons, schedule, onScheduleChange]);

    const deleteLessons = useCallback((lessonIds: string[]) => {
        const updatedLessons = lessons.filter(l => {
            const uid = `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`;
            return !lessonIds.includes(uid);
        });

        const newResponse: ScheduleResponse = schedule?.status === 'conflict'
            ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
            : { status: 'success', schedule: updatedLessons };
        onScheduleChange(newResponse);
    }, [lessons, schedule, onScheduleChange]);

    const assignTeacherToLessons = useCallback((lessonIds: string[], teacherId: string) => {
        const updatedLessons = lessons.map(l => {
            const uid = `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`;
            if (lessonIds.includes(uid)) {
                return { ...l, teacher_id: teacherId };
            }
            return l;
        });

        const newResponse: ScheduleResponse = schedule?.status === 'conflict'
            ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
            : { status: 'success', schedule: updatedLessons };
        onScheduleChange(newResponse);
    }, [lessons, schedule, onScheduleChange]);

    return {
        draggedLesson, setDraggedLesson,
        dragOverCell, setDragOverCell,
        dragConfirm, setDragConfirm,
        handleSaveLesson,
        executeDragAction,
        processDrop,
        processTeacherDrop,
        deleteLessons,
        assignTeacherToLessons
    };
};
