import { useEffect } from 'react';

/**
 * Hook to fix the 100vh bug on iOS/Android tablets.
 * Sets a CSS custom property --vh that represents the true viewport height.
 * This must be called once at app root level.
 */
export function useViewportHeight() {
  useEffect(() => {
    const setViewportHeight = () => {
      // Get the actual inner height of the window
      const vh = window.innerHeight * 0.01;
      // Set the value as a CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      // Also set the full height for convenience
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    // Set initial value
    setViewportHeight();

    // Update on resize (handles orientation change)
    window.addEventListener('resize', setViewportHeight);
    
    // Also listen for orientation change explicitly for iOS
    window.addEventListener('orientationchange', () => {
      // Delay to ensure the browser has finished updating
      setTimeout(setViewportHeight, 100);
    });

    // Handle visibility change (when UI elements appear/disappear)
    document.addEventListener('visibilitychange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      document.removeEventListener('visibilitychange', setViewportHeight);
    };
  }, []);
}

export default useViewportHeight;
