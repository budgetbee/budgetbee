import { useEffect, useRef, useCallback } from "react";
import Api from "../Api/Endpoints";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity → logout
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;   // Refresh token every 10 minutes while active

/**
 * Hook that:
 * 1. Refreshes the auth token periodically while the user is active
 * 2. Auto-logouts silently after 30 minutes of inactivity
 */
export function useSessionManager() {
    const lastActivityRef = useRef(Date.now());
    const logoutTimerRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    const resetTimers = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

        logoutTimerRef.current = setTimeout(() => {
            Api.userLogout();
        }, INACTIVITY_TIMEOUT_MS);
    }, []);

    useEffect(() => {
        const onActivity = () => resetTimers();

        const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
        events.forEach((event) => {
            window.addEventListener(event, onActivity, { passive: true });
        });

        refreshIntervalRef.current = setInterval(() => {
            const idleTime = Date.now() - lastActivityRef.current;
            if (idleTime < REFRESH_INTERVAL_MS) {
                Api.refreshToken();
            }
        }, REFRESH_INTERVAL_MS);

        resetTimers();

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, onActivity);
            });
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [resetTimers]);
}
