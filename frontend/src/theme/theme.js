import { createTheme } from "@mui/material/styles";

export const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#10b981" : "#059669",
        light: mode === "dark" ? "#34d399" : "#10b981",
        dark: mode === "dark" ? "#047857" : "#065f46",
        contrastText: "#ffffff",
      },
      secondary: {
        main: mode === "dark" ? "#38bdf8" : "#0284c7",
        light: mode === "dark" ? "#7dd3fc" : "#38bdf8",
        dark: mode === "dark" ? "#0369a1" : "#0c4a6e",
        contrastText: "#ffffff",
      },
      background: {
        default: mode === "dark" ? "#090d16" : "#f8fafc",
        paper: mode === "dark" ? "#131b2e" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#f8fafc" : "#0f172a",
        secondary: mode === "dark" ? "#94a3b8" : "#64748b",
      },
      divider: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
      success: {
        main: mode === "dark" ? "#34d399" : "#059669",
        light: mode === "dark" ? "rgba(52, 211, 153, 0.12)" : "rgba(5, 150, 105, 0.08)",
      },
      warning: {
        main: mode === "dark" ? "#fbbf24" : "#d97706",
        light: mode === "dark" ? "rgba(251, 191, 36, 0.12)" : "rgba(217, 119, 6, 0.08)",
      },
      error: {
        main: mode === "dark" ? "#f87171" : "#dc2626",
        light: mode === "dark" ? "rgba(248, 113, 113, 0.12)" : "rgba(220, 38, 38, 0.08)",
      },
      info: {
        main: mode === "dark" ? "#60a5fa" : "#2563eb",
        light: mode === "dark" ? "rgba(96, 165, 250, 0.12)" : "rgba(37, 99, 235, 0.08)",
      },
    },
    typography: {
      fontFamily: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        "sans-serif",
      ].join(","),
      h4: {
        fontWeight: 750,
        letterSpacing: "-0.03em",
        lineHeight: 1.2,
      },
      h5: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1.25,
      },
      h6: {
        fontWeight: 650,
        letterSpacing: "-0.015em",
        lineHeight: 1.3,
      },
      subtitle1: {
        fontWeight: 600,
        lineHeight: 1.4,
      },
      subtitle2: {
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        lineHeight: 1.55,
      },
      body2: {
        lineHeight: 1.5,
      },
      caption: {
        letterSpacing: "0.01em",
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontVariantNumeric: "tabular-nums",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            transition: "all 0.15s cubic-bezier(0.2, 0, 0, 1)",
            "&:hover": {
              boxShadow: "none",
            },
            "&:active": {
              transform: "scale(0.97)",
            },
          },
          containedPrimary: {
            backgroundImage:
              mode === "dark"
                ? "linear-gradient(180deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(180deg, #059669 0%, #047857 100%)",
            border: mode === "dark" ? "1px solid rgba(255,255,255,0.15)" : "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border:
              mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow:
              mode === "dark"
                ? "0 4px 24px -1px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
                : "0 1px 3px rgba(0,0,0,0.02), 0 4px 16px -2px rgba(15, 23, 42, 0.04)",
            transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "dark" ? "#1e293b" : "#0f172a",
            color: "#ffffff",
            fontSize: "0.75rem",
            fontWeight: 500,
            borderRadius: 6,
            padding: "5px 9px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          },
          arrow: {
            color: mode === "dark" ? "#1e293b" : "#0f172a",
          },
        },
      },
    },
  });
