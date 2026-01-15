import { useState, useEffect, useMemo } from 'react';
import { BELL_SCHEDULE } from '../constants';

/**
 * Hook for tracking real-time clock and current lesson period.
 * 
 * @param lowFrequency - If true, updates once per minute (for dashboard). 
 *                       If false, updates every second (for active countdowns).
 */
export const useTimeInfo = (lowFrequency: boolean = false) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = lowFrequency ? 60000 : 1000;
        const timer = setInterval(() => setNow(new Date()), interval);
        return () => clearInterval(timer);
    }, [lowFrequency]);

    const timeInfo = useMemo(() => {
        const h = now.getHours();
        const m = now.getMinutes();
        const currentTimeInMinutes = h * 60 + m;

        const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
        const apiDaysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayApiDay = apiDaysMap[dayIndex] || "Mon";

        let currentPeriod = -1;
        let isBreak = false;
        let minutesLeft = 0;
        let nextPeriod = -1;

        for (let i = 0; i < BELL_SCHEDULE.length; i++) {
            const b = BELL_SCHEDULE[i];
            const [sH, sM] = b.start.split(':').map(Number);
            const [eH, eM] = b.end.split(':').map(Number);
            const startMins = sH * 60 + sM;
            const endMins = eH * 60 + eM;

            if (currentTimeInMinutes >= startMins && currentTimeInMinutes < endMins) {
                currentPeriod = b.period;
                minutesLeft = endMins - currentTimeInMinutes;
                nextPeriod = BELL_SCHEDULE[i + 1]?.period || -1;
                break;
            }

            if (i < BELL_SCHEDULE.length - 1) {
                const nextB = BELL_SCHEDULE[i + 1];
                const [nextSH, nextSM] = nextB.start.split(':').map(Number);
                const nextStartMins = nextSH * 60 + nextSM;

                if (currentTimeInMinutes >= endMins && currentTimeInMinutes < nextStartMins) {
                    isBreak = true;
                    minutesLeft = nextStartMins - currentTimeInMinutes;
                    nextPeriod = nextB.period;
                    break;
                }
            }
        }

        // If before first lesson
        const first = BELL_SCHEDULE[0];
        const [fSH, fSM] = first.start.split(':').map(Number);
        const firstStart = fSH * 60 + fSM;
        if (currentTimeInMinutes < firstStart) {
            isBreak = true;
            minutesLeft = firstStart - currentTimeInMinutes;
            nextPeriod = first.period;
        }

        return { todayApiDay, currentPeriod, isBreak, minutesLeft, nextPeriod };
    }, [now]);

    return { now, timeInfo };
};
