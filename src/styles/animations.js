// src/styles/animations.js

/**
 * Reusable animation configurations for Framer Motion or general CSS transitions.
 * This file helps maintain a consistent motion design language.
 */

export const transition = {
  // Default transition for most elements
  default: {
    duration: 0.3, // Corresponds to theme.transition.duration.DEFAULT
    ease: [0.4, 0, 0.2, 1], // Corresponds to theme.transition.timing.DEFAULT (ease-in-out)
  },
  // Faster transition for quick feedback (e.g., hover effects)
  fast: {
    duration: 0.15, // Corresponds to theme.transition.duration.fast
    ease: "linear",
  },
  // Slower transition for larger elements or significant view changes
  slow: {
    duration: 0.5, // Corresponds to theme.transition.duration.slow
    ease: [0.4, 0, 0.2, 1],
  },
  // Spring animation for more playful interactions
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  // Gentle spring for subtle movements
  gentleSpring: {
    type: "spring",
    stiffness: 100,
    damping: 20,
  },
};

export const variants = {
  // Fade in/out
  fadeInOut: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  // Fade in with a slight upward movement
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  // Fade in with a slight downward movement
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  // Slide in from left
  slideInLeft: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: "0%", opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  // Slide in from right
  slideInRight: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: "0%", opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  // Scale up from center
  scaleUp: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  // Scale down from center
  scaleDown: {
    initial: { scale: 1.1, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
  },
  // Stagger children animation
  staggerContainer: (staggerChildren = 0.1, delayChildren = 0) => ({
    initial: {},
    animate: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
    exit: {}
  }),
  // Item for stagger container
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  // Pop animation for buttons or interactive elements
  pop: {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.1 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  },
  // Rotate animation
  rotate: (degrees = 90) => ({
    initial: { rotate: 0 },
    animate: { rotate: degrees },
    exit: { rotate: 0 },
  }),
  // For list items appearing one by one
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  // Used for the CalendarContainer view transitions (to match CSS animation)
  viewTransition: {
    initial: { opacity: 0.6, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }, // Slight difference for exit to feel natural
  },
};

// Tailwind CSS class-based animation utilities (if not using Framer Motion extensively)
// These would be defined in tailwind.config.js `theme.extend.animation` and `theme.extend.keyframes`
// This JS file can serve as a reference or for dynamic class application.
export const tailwindAnimations = {
  fadeIn: "animate-fadeIn",
  fadeOut: "animate-fadeOut", // Assuming a fadeOut keyframe is defined
  slideInLeft: "animate-slideInLeft",
  slideOutLeft: "animate-slideOutLeft", // Assuming keyframes defined
  slideInRight: "animate-slideInRight",
  slideOutRight: "animate-slideOutRight", // Assuming keyframes defined
  spin: "animate-spin",
  ping: "animate-ping",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  // Calendar view specific
  viewTransition: "animate-viewTransition",
};

// Example of how these might be used with Framer Motion:
// import { motion } from "framer-motion";
// import { transition, variants } from "./animations";
//
// <motion.div
//   initial="initial"
//   animate="animate"
//   exit="exit"
//   variants={variants.fadeInUp}
//   transition={transition.default}
// >
//   Content
// </motion.div>
