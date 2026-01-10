export interface Subject {
    id: string;
    name: string;
    color?: string;
    defaultRoom?: string;
}



export interface Teacher {
    id: string;
    name: string;
    subjects: string[]; // Subject IDs
    is_primary?: boolean; // Can teach any subject for primary grades (1-4)
    photo?: string; // Optional base64 or URL
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
}
