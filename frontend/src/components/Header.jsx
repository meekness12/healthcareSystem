import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  LocalHospital,
  Brightness4,
  Brightness7,
  Warning,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useThemeMode } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getRoleDashboardPath, getRoleLabel } from "../utils/roles";

const Header = ({ onMobileMenuClick, isInsideLayout = false }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { mode, toggleColorMode } = useThemeMode();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === "dark" ? "#0b101b" : "#ffffff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: "64px !important",
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Left Side: Brand on Guest/Mobile, Hospital Telemetry on Desktop in AppLayout */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Mobile Hamburger Menu Toggle (When inside layout) */}
          {isInsideLayout && !isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMobileMenuClick}
              sx={{
                p: 0.8,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                mr: 0.5,
              }}
              aria-label="Open navigation menu"
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}

          {/* If inside layout on desktop: Display Hospital Telemetry Pill */}
          {isInsideLayout && isDesktop ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(5,150,105,0.04)",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#10b981",
                    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.25)",
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { opacity: 0.6 },
                      "50%": { opacity: 1 },
                      "100%": { opacity: 0.6 },
                    },
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 650, color: "text.primary", fontSize: "0.82rem" }}>
                  RP Karongi Teaching Hospital Network
                </Typography>
                <Chip
                  label="MoH VERIFIED"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 18, fontSize: "0.62rem", fontWeight: 750, letterSpacing: "0.03em" }}
                />
              </Box>
            </Box>
          ) : (
            /* Brand Logo for Guest pages or mobile */
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer" }}
              onClick={() =>
                isAuthenticated && user
                  ? navigate(getRoleDashboardPath(user.role))
                  : navigate("/")
              }
            >
              <LocalHospital color="primary" sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" color="primary" sx={{ lineHeight: 1.1, fontWeight: 800 }}>
                  Healthcare System
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                  Rwanda Hospital Network
                </Typography>
              </Box>
            </Box>
          )}

          {/* Public Hospital Directory Links (Guest or Desktop) */}
          {!isInsideLayout && (
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, ml: 2 }}>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate("/branches")}
                sx={{ fontWeight: 600, color: "text.secondary", "&:hover": { color: "primary.main" } }}
              >
                Branches
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate("/doctors")}
                sx={{ fontWeight: 600, color: "text.secondary", "&:hover": { color: "primary.main" } }}
              >
                Doctors
              </Button>
            </Box>
          )}
        </Box>

        {/* Right Side: Emergency Triage + Theme + User profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Emergency Triage Quick Button */}
          <Button
            color="error"
            size="small"
            variant="outlined"
            onClick={() => navigate("/emergency/triage")}
            startIcon={<Warning sx={{ fontSize: 16 }} />}
            sx={{
              fontWeight: 700,
              fontSize: "0.74rem",
              borderRadius: 2,
              px: 1.5,
              py: 0.4,
              textTransform: "none",
              borderColor: "error.main",
              display: { xs: "none", sm: "inline-flex" },
              "&:hover": { bgcolor: "error.main", color: "#fff" },
            }}
          >
            Emergency Triage
          </Button>

          {/* Theme Mode Toggle Button */}
          <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
            <IconButton
              onClick={toggleColorMode}
              color="inherit"
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {mode === "dark" ? <Brightness7 sx={{ fontSize: 18 }} color="warning" /> : <Brightness4 sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          {/* Authenticated User Mini Pill or Guest Buttons */}
          {isAuthenticated && user ? (
            <Box
              onClick={() => navigate("/profile")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                p: 0.5,
                px: 1,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(5,150,105,0.04)",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "primary.main",
                },
              }}
            >
              <Avatar
                src={user.avatar_url || undefined}
                alt={user.name}
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "primary.main",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
                <Typography variant="body2" sx={{ fontWeight: 650, lineHeight: 1.15, fontSize: "0.82rem" }}>
                  {user.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ fontWeight: 700, textTransform: "capitalize", fontSize: "0.68rem" }}
                >
                  {getRoleLabel(user.role)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="text" color="inherit" size="small" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button variant="contained" color="primary" size="small" onClick={() => navigate("/register")}>
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
