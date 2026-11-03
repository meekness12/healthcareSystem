import { createTheme } from "@mui/material/styles";

export const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#14b8a6" : "#0d9488",
        light: mode === "dark" ? "#2dd4bf" : "#14b8a6",
        dark: mode === "dark" ? "#0f766e" : "#042f2e",
        contrastText: "#ffffff",
      },
      secondary: {
        main: mode === "dark" ? "#38bdf8" : "#0284c7",
        light: mode === "dark" ? "#7dd3fc" : "#38bdf8",
        dark: mode === "dark" ? "#0369a1" : "#0c4a6e",
        contrastText: "#ffffff",
      },
      background: {
        default: mode === "dark" ? "#0b0f17" : "#f8fafc",
        paper: mode === "dark" ? "#131b2a" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#f1f5f9" : "#0f172a",
        secondary: mode === "dark" ? "#94a3b8" : "#64748b",
      },
      divider: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      success: {
        main: mode === "dark" ? "#34d399" : "#059669",
      },
      warning: {
        main: mode === "dark" ? "#fbbf24" : "#d97706",
      },
      error: {
        main: mode === "dark" ? "#f87171" : "#dc2626",
      },
      info: {
        main: mode === "dark" ? "#60a5fa" : "#2563eb",
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
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h5: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
      },
      h6: {
        fontWeight: 600,
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
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
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
            borderRadius: 12,
            border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            boxShadow: mode === "dark" ? "0 4px 20px rgba(0, 0, 0, 0.4)" : "0 2px 10px rgba(0, 0, 0, 0.04)",
          },
        },
      },
    },
  });
