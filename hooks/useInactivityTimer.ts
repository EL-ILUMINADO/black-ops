import { useEffect, useRef } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';

export const useInactivityTimer = (timeoutMs: number = 20000) => {
  const lockChat = useSecurityStore((state) => state.lockChat);
  const isUnlocked = useSecurityStore((state) => state.isUnlocked);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;

    // The Dead Man's Switch: Reset the 20-second countdown on any activity
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      timerRef.current = setTimeout(() => {
        lockChat();
      }, timeoutMs);
    };

    // The Window Blinds: Instant lock on tab/window switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lockChat();
      }
    };

    const activeEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'mousedown'];

    resetTimer();
    activeEvents.forEach((event) => window.addEventListener(event, resetTimer));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activeEvents.forEach((event) => window.removeEventListener(event, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    
  }, [isUnlocked, lockChat, timeoutMs]);
};