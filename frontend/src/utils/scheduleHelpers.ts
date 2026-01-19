import type { Lesson, TeachingPlanItem } from '../types';

/**
 * Gets the ISO week ID for a given date (e.g., "2024-W01")
 */
export function getWeekId(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Returns the Monday of the week for a given date.
 */
export function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

/**
 * Gets a formatted date (DD.MM) for a specific day of the week based on its index from Monday.
 * @param mondayDate The Monday of the week (Date or ISO string)
 * @param dayIndex 0 for Monday, 1 for Tuesday, etc.
 */
export function getDayDate(mondayDate: Date | string, dayIndex: number): string {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + dayIndex);
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dd}.${mm}`;
}

export interface UnscheduledItem {
    subject_id: string;
    class_id: string;
    teacher_id: string;
    total_hours: number;
    placed_hours: number;
    remaining_hours: number;
}

/**
 * Calculates which lessons from the plan are missing from the schedule.
 */
export function getUnscheduledLessons(plan: TeachingPlanItem[], schedule: Lesson[]): UnscheduledItem[] {
    const unscheduled: UnscheduledItem[] = [];

    plan.forEach(planItem => {
        const placedCount = schedule.filter(l =>
            l.class_id === planItem.class_id &&
            l.subject_id === planItem.subject_id &&
            l.teacher_id === planItem.teacher_id
        ).length;

        if (placedCount < planItem.hours_per_week) {
            unscheduled.push({
                subject_id: planItem.subject_id,
                class_id: planItem.class_id,
                teacher_id: planItem.teacher_id,
                total_hours: planItem.hours_per_week,
                placed_hours: placedCount,
                remaining_hours: planItem.hours_per_week - placedCount
            });
        }
    });

    return unscheduled;
}

/**
 * Removes excess lessons from the schedule if the plan hours have been reduced.
 * Prioritizes removing lessons from Friday backwards (Fri -> Mon), 
 * and from latest period backwards (Period 8 -> Period 1).
 */
export function removeExcessLessons(plan: TeachingPlanItem[], schedule: Lesson[]): Lesson[] {
    let newSchedule = [...schedule];

    // We iterate over the plan to check each item's quota
    // BUT we also need to check for lessons that might not be in the plan anymore at all
    // (though in this app, usually we just update the plan item, not delete and recreate immediately without notice)
    // Actually, if a plan item is removed, those lessons naturally become "excess" or "orphaned".
    // For now, let's focus on: "If hours decreased for an existing plan item".

    plan.forEach(planItem => {
        const relevantLessons = newSchedule.filter(l =>
            l.class_id === planItem.class_id &&
            l.subject_id === planItem.subject_id &&
            l.teacher_id === planItem.teacher_id
        );

        if (relevantLessons.length > planItem.hours_per_week) {
            const excessCount = relevantLessons.length - planItem.hours_per_week;

            // Sort lessons to identify which ones to remove first
            // Priority: Day index (desc), Period (desc)
            // Days: Mon, Tue, Wed, Thu, Fri. We want to remove Fri first.
            const dayOrder = { "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Пн": 0, "Вт": 1, "Ср": 2, "Чт": 3, "Пт": 4 };

            relevantLessons.sort((a, b) => {
                const dayA = dayOrder[a.day as keyof typeof dayOrder] ?? -1;
                const dayB = dayOrder[b.day as keyof typeof dayOrder] ?? -1;

                if (dayA !== dayB) {
                    return dayB - dayA; // Higher day index (Friday) comes first
                }
                return b.period - a.period; // Higher period comes first
            });

            // Take the first N lessons (which vary by sort are the "latest" in the week)
            const lessonsToRemove = relevantLessons.slice(0, excessCount);

            // Filter out these lessons from the schedule
            newSchedule = newSchedule.filter(l => !lessonsToRemove.includes(l));
        }
    });

    // Also handle completely orphaned lessons (if a plan item was deleted entirely)
    // This assumes 'plan' is the source of truth.
    // Optimization: This might be heavy if done every render, but okay for "on change" events.
    newSchedule = newSchedule.filter(l => {
        const existsInPlan = plan.some(p =>
            p.class_id === l.class_id &&
            p.subject_id === l.subject_id &&
            p.teacher_id === l.teacher_id
        );
        // If it returns false, it means the lesson exists in schedule but no corresponding plan item exists.
        // We should PROBABLY remove it. User asked "if we subtracted hours", implying the item still exists but hours < count.
        // But if we delete the plan row, we probably want lessons gone too.
        return existsInPlan;
    });

    return newSchedule;
}
