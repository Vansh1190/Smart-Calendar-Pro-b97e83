export const theme = {
  colors: {
    primary: {
      light: "#60a5fa", // blue-400
      DEFAULT: "#3b82f6", // blue-500
      dark: "#2563eb", // blue-600
      contrastText: "#ffffff",
    },
    secondary: {
      light: "#a78bfa", // violet-400
      DEFAULT: "#8b5cf6", // violet-500
      dark: "#7c3aed", // violet-600
      contrastText: "#ffffff",
    },
    accent: {
      light: "#f472b6", // pink-400
      DEFAULT: "#ec4899", // pink-500
      dark: "#db2777", // pink-600
      contrastText: "#ffffff",
    },
    neutral: {
      50: "#f8fafc", // slate-50
      100: "#f1f5f9", // slate-100
      200: "#e2e8f0", // slate-200
      300: "#cbd5e1", // slate-300
      400: "#94a3b8", // slate-400
      500: "#64748b", // slate-500
      600: "#475569", // slate-600
      700: "#334155", // slate-700
      800: "#1e293b", // slate-800
      900: "#0f172a", // slate-900
    },
    text: {
      primary: "#1e293b", // slate-800
      secondary: "#475569", // slate-600
      disabled: "#94a3b8", // slate-400
      link: "#3b82f6", // blue-500
      linkHover: "#2563eb", // blue-600
    },
    background: {
      default: "#f1f5f9", // slate-100 (page bg)
      paper: "#ffffff", // white (card/modal bg)
      sidebar: "#f8fafc", // slate-50
      header: "#ffffff",
    },
    border: {
      default: "#e2e8f0", // slate-200
      divider: "#cbd5e1", // slate-300
      input: "#cbd5e1", // slate-300
      inputFocus: "#3b82f6", // blue-500
    },
    status: {
      success: {
        light: "#d1fae5", // green-100
        DEFAULT: "#10b981", // green-500
        dark: "#059669", // green-600
        contrastText: "#ffffff",
      },
      error: {
        light: "#fee2e2", // red-100
        DEFAULT: "#ef4444", // red-500
        dark: "#dc2626", // red-600
        contrastText: "#ffffff",
      },
      warning: {
        light: "#fef3c7", // amber-100
        DEFAULT: "#f59e0b", // amber-500
        dark: "#d97706", // amber-600
        contrastText: "#1e293b", // slate-800
      },
      info: {
        light: "#dbeafe", // blue-100
        DEFAULT: "#3b82f6", // blue-500
        dark: "#2563eb", // blue-600
        contrastText: "#ffffff",
      },
    },
    eventColors: [
      "#3B82F6", // blue-500
      "#10B981", // green-500
      "#F59E0B", // amber-500
      "#EF4444", // red-500
      "#8B5CF6", // violet-500
      "#EC4899", // pink-500
      "#64748B", // slate-500
      "#F97316", // orange-500
    ],
  },
  typography: {
    fontFamily: {
      sans: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"",
      serif: "Georgia, Cambria, \"Times New Roman\", Times, serif",
      mono: "Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
    },
    fontSizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeights: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
    letterSpacings: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
  },
  spacing: {
    px: "1px",
    "0": "0",
    "0.5": "0.125rem", // 2px
    "1": "0.25rem", // 4px
    "1.5": "0.375rem", // 6px
    "2": "0.5rem", // 8px
    "2.5": "0.625rem", // 10px
    "3": "0.75rem", // 12px
    "3.5": "0.875rem", // 14px
    "4": "1rem", // 16px
    "5": "1.25rem", // 20px
    "6": "1.5rem", // 24px
    "7": "1.75rem", // 28px
    "8": "2rem", // 32px
    "9": "2.25rem", // 36px
    "10": "2.5rem", // 40px
    "11": "2.75rem", // 44px
    "12": "3rem", // 48px
    "14": "3.5rem", // 56px
    "16": "4rem", // 64px
    "20": "5rem", // 80px
    "24": "6rem", // 96px
  },
  borders: {
    radius: {
      none: "0px",
      sm: "0.125rem", // 2px
      DEFAULT: "0.25rem", // 4px
      md: "0.375rem", // 6px
      lg: "0.5rem", // 8px
      xl: "0.75rem", // 12px
      "2xl": "1rem", // 16px
      "3xl": "1.5rem", // 24px
      full: "9999px",
    },
    width: {
      DEFAULT: "1px",
      "0": "0px",
      "2": "2px",
      "4": "4px",
      "8": "8px",
    },
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  components: {
    button: {
      borderRadius: "0.375rem", // md
      paddingX: "1rem", // spacing.4
      paddingY: "0.5rem", // spacing.2
      fontSize: "0.875rem", // sm
      fontWeight: 600, // semibold
      primary: {
        bg: "#3b82f6", // colors.primary.DEFAULT
        text: "#ffffff",
        hoverBg: "#2563eb", // colors.primary.dark
      },
      secondary: {
        bg: "#e2e8f0", // colors.neutral.200
        text: "#334155", // colors.neutral.700
        hoverBg: "#cbd5e1", // colors.neutral.300
      },
      destructive: {
        bg: "#ef4444", // colors.status.error.DEFAULT
        text: "#ffffff",
        hoverBg: "#dc2626", // colors.status.error.dark
      },
      outline: {
        borderColor: "#cbd5e1", // colors.neutral.300
        text: "#475569", // colors.neutral.600
        hoverBg: "#f1f5f9", // colors.neutral.100
      },
      ghost: {
        text: "#475569", // colors.neutral.600
        hoverBg: "#f1f5f9", // colors.neutral.100
      }
    },
    input: {
      borderRadius: "0.375rem", // md
      paddingX: "0.75rem", // spacing.3
      paddingY: "0.5rem", // spacing.2
      fontSize: "0.875rem", // sm
      borderColor: "#cbd5e1", // colors.border.input
      focusBorderColor: "#3b82f6", // colors.border.inputFocus
      backgroundColor: "#ffffff",
      placeholderColor: "#94a3b8", // colors.neutral.400
    },
    card: {
      borderRadius: "0.5rem", // lg
      padding: "1.5rem", // spacing.6
      backgroundColor: "#ffffff", // colors.background.paper
      shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // shadows.md
      borderColor: "#e2e8f0", // colors.border.default
    },
    modal: {
      borderRadius: "0.5rem", // lg
      padding: "1.5rem", // spacing.6
      backgroundColor: "#ffffff", // colors.background.paper
      shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", // shadows.xl
      overlayBg: "rgba(15, 23, 42, 0.6)", // slate-900 with opacity
    },
    calendar: {
      header: {
        backgroundColor: "#ffffff",
        textColor: "#1e293b", // slate-800
        borderColor: "#e2e8f0", // slate-200
      },
      dayCell: {
        borderColor: "#e2e8f0", // slate-200
        hoverBg: "#f1f5f9", // slate-100
        selectedBg: "#dbeafe", // blue-100
        selectedTextColor: "#1e293b", // slate-800
        todayBorderColor: "#3b82f6", // blue-500
        otherMonthTextColor: "#94a3b8", // slate-400
      },
      event: {
        borderRadius: "0.25rem", // default
        paddingX: "0.5rem", // spacing.2
        paddingY: "0.125rem", // spacing.0.5
        fontSize: "0.75rem", // xs
        defaultBg: "#3b82f6", // blue-500 (can be overridden by event.color)
        defaultTextColor: "#ffffff",
      },
      timeIndicator: {
        color: "#ef4444", // red-500
      },
    },
    tooltip: {
      backgroundColor: "#1e293b", // slate-800
      textColor: "#f1f5f9", // slate-100
      paddingX: "0.5rem",
      paddingY: "0.25rem",
      borderRadius: "0.25rem",
      fontSize: "0.75rem",
    },
    dropdown: {
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderRadius: "0.375rem",
      shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // shadows.md
      item: {
        paddingX: "0.75rem",
        paddingY: "0.5rem",
        hoverBg: "#f1f5f9",
      }
    }
  },
  zIndex: {
    dropdown: 10,
    sticky: 20,
    banner: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    toast: 80,
  },
  transition: {
    duration: {
      fast: "150ms",
      DEFAULT: "300ms",
      slow: "500ms",
    },
    timing: {
      DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      linear: "linear",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
};
