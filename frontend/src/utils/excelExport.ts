import * as XLSX from 'xlsx';
import type { Teacher, Lesson, Subject, ClassGroup } from '../types';
import { BELL_SCHEDULE } from '../constants';

const DAYS_UKR = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця'];
const DAYS_API = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const exportTeacherSchedule = (
    teacher: Teacher,
    lessons: Lesson[],
    subjects: Subject[],
    classes: ClassGroup[],
    options: { onlyClassNames?: boolean } = {}
) => {
    const workbook = XLSX.utils.book_new();
    const data: any[][] = [];

    // Header row: Days
    data.push(['Урок', 'Час', ...DAYS_UKR]);

    // Grid rows: Periods
    BELL_SCHEDULE.forEach((slot) => {
        const row = [slot.period, `${slot.start}-${slot.end}`];

        DAYS_API.forEach((dayApi) => {
            const lesson = lessons.find(l => l.day === dayApi && l.period === slot.period && l.teacher_id === teacher.id);
            if (lesson) {
                const subject = subjects.find(s => s.id === lesson.subject_id)?.name || 'Урок';
                const cls = classes.find(c => c.id === lesson.class_id)?.name || lesson.class_id;
                const room = lesson.room ? ` (каб. ${lesson.room})` : '';

                if (options.onlyClassNames) {
                    row.push(cls);
                } else {
                    row.push(`${subject}\n${cls}${room}`);
                }
            } else {
                row.push('');
            }
        });
        data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const wscols = [
        { wch: 5 }, // Period
        { wch: 12 }, // Time
        ...DAYS_UKR.map(() => ({ wch: 25 })) // Days
    ];
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Розклад');
    XLSX.writeFile(workbook, `Розклад_${teacher.name}.xlsx`);
};

export const exportMasterTeacherSchedule = (
    teachers: Teacher[],
    lessons: Lesson[],
    subjects: Subject[],
    classes: ClassGroup[],
    options: { onlyClassNames?: boolean } = {}
) => {
    const workbook = XLSX.utils.book_new();
    const data: any[][] = [];

    // Header row 1: Teachers/Slots
    const header1 = ['Вчитель', ...DAYS_UKR.flatMap(day => Array(BELL_SCHEDULE.length).fill(day))];
    // Header row 2: Periods
    const header2 = ['', ...DAYS_UKR.flatMap(() => BELL_SCHEDULE.map(s => s.period))];

    data.push(header1);
    data.push(header2);

    teachers.forEach(teacher => {
        const row = [teacher.name];
        DAYS_API.forEach(dayApi => {
            BELL_SCHEDULE.forEach(slot => {
                const lesson = lessons.find(l => l.day === dayApi && l.period === slot.period && l.teacher_id === teacher.id);
                if (lesson) {
                    const subject = subjects.find(s => s.id === lesson.subject_id)?.name || 'Урок';
                    const cls = classes.find(c => c.id === lesson.class_id)?.name || lesson.class_id;

                    if (options.onlyClassNames) {
                        row.push(cls);
                    } else {
                        row.push(`${subject} (${cls})`);
                    }
                } else {
                    row.push('');
                }
            });
        });
        data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Add merges for Header 1 (Days)
    const merges = DAYS_UKR.map((_, i) => ({
        s: { r: 0, c: 1 + i * BELL_SCHEDULE.length },
        e: { r: 0, c: 1 + (i + 1) * BELL_SCHEDULE.length - 1 }
    }));
    worksheet['!merges'] = merges;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Загальний_розклад_вчителів');
    XLSX.writeFile(workbook, `Загальний_розклад_вчителів.xlsx`);
};
