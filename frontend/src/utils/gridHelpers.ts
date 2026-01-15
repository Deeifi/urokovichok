/**
 * Utility functions for schedule grid styling and logic.
 */

/**
 * Returns a high-contrast Tailwind color class based on the room number.
 * Rooms on different floors receive different color themes.
 * 
 * @param room - Optional room string (e.g. "101", "204")
 */
export const getRoomColor = (room: string | undefined): string => {
    if (!room) return 'bg-white/5 text-[#a1a1aa]';
    const firstChar = room.trim()[0];
    switch (firstChar) {
        case '1': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'; // 1st floor - Green
        case '2': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'; // 2nd floor - Blue
        case '3': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'; // 3rd floor - Orange
        case '4': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'; // 4th floor - Red
        default: return 'bg-white/10 text-white border border-white/10';
    }
};

/**
 * Resolves the display color for a subject, falling back to a palette if not specified.
 * 
 * @param subjectId - UUID of the subject
 * @param subjects - Full list of subjects from the store
 */
export const getSubjectColor = (subjectId: string, subjects: { id: string, color?: string }[]): string => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject?.color) return subject.color;
    const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const index = subjects.findIndex(s => s.id === subjectId);
    // Safety check if not found
    if (index === -1) return palette[0];
    return palette[index % palette.length];
};
