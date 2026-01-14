export interface Subject {
    id: string;
    name: string;
    color?: string;
    defaultRoom?: string;
    icon?: string;
}



export interface Teacher {
    id: string;
    name: string;
    subjects: string[]; // Subject IDs
    is_primary?: boolean; // Can teach any subject for primary grades (1-4)
    prefers_period_zero?: boolean; // Teacher prefers early morning lessons (period 0)
    photo?: string; // Optional base64 or URL
    availability?: Record<string, number[]>; // Blocked periods per day (e.g., {"Mon": [0, 1]})
}

export interface ClassGroup {
    id: string;
    name: string;
    excluded_subjects?: string[]; // IDs of subjects not applicable for this class
}

export interface TeachingPlanItem {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    hours_per_week: number;
    room?: string;
    videoLink?: string;
}

export interface ScheduleRequest {
    teachers: Teacher[];
    subjects: Subject[];
    classes: ClassGroup[];
    plan: TeachingPlanItem[];
}

export interface Lesson {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day: string;
    period: number;
    room?: string;
    isUnscheduled?: boolean;
}

export type ScheduleResponse =
    | { status: 'success'; schedule: Lesson[] }
    | { status: 'error'; message: string }
    | { status: 'conflict'; schedule: Lesson[]; violations: string[] };

export interface PerformanceSettings {
    disableAnimations: boolean;
    disableBlur: boolean;
    disableShadows: boolean;
    hidePhotos: boolean;
    lowFrequencyClock: boolean;
    disableHoverEffects: boolean;
}

export type ViewType = 'dashboard' | 'byClass' | 'matrix' | 'teachers';
