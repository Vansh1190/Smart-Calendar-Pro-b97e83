import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for tracking whether a media query matches.
 *
 * @param {string} query The media query string (e.g., "(min-width: 768px)")
 * @returns {boolean} True if the media query matches, false otherwise.
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return false; // Default for SSR or environments without matchMedia
  });

  const handleChange = useCallback((event) => {
    setMatches(event.matches);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return; // Exit if matchMedia is not available
    }

    const mediaQueryList = window.matchMedia(query);

    // Initial check
    setMatches(mediaQueryList.matches);

    // Add listener for changes
    // Use addEventListener/removeEventListener for modern browsers
    // and addListener/removeListener for older ones (Safari < 14)
    try {
        mediaQueryList.addEventListener("change", handleChange);
    } catch (e) {
        // Fallback for older browsers
        mediaQueryList.addListener(handleChange);
    }


    return () => {
      try {
        mediaQueryList.removeEventListener("change", handleChange);
      } catch (e) {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query, handleChange]);

  return matches;
};

export default useMediaQuery;

/**
 * Predefined breakpoints for common use cases.
 * These should align with your Tailwind CSS configuration if you're using it.
 */
export const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
  // You can also add max-width queries or orientation queries
  portrait: "(orientation: portrait)",
  landscape: "(orientation: landscape)",
  // Example for targeting mobile more specifically (max-width)
  mobile: "(max-width: 767px)", // Anything less than md
};

/**
 * Hook to get the current breakpoint name (sm, md, lg, xl, 2xl).
 * This is a more opinionated hook that returns a string representing the current breakpoint.
 * @returns {string} The name of the current breakpoint.
 */
export const useBreakpoint = () => {
  const is2Xl = useMediaQuery(breakpoints["2xl"]);
  const isXl = useMediaQuery(breakpoints.xl);
  const isLg = useMediaQuery(breakpoints.lg);
  const isMd = useMediaQuery(breakpoints.md);
  const isSm = useMediaQuery(breakpoints.sm);

  if (is2Xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return "xs"; // Smallest, default breakpoint
};
