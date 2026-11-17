import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Tooltip,
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
import { getRoleDashboardPath } from "../utils/roles";
import SidebarDrawer from "./SidebarDrawer";

const Header = () => {
  const { mode, toggleColorMode } = useThemeMode();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Brand & Hospital Network */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
          {isAuthenticated && user && (
            <Tooltip title="Open Left Navigation Menu">
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setSidebarOpen(true)}
                sx={{
                  mr: 0.5,
                  p: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                }}
                aria-label="Open sidebar menu"
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
            onClick={() =>
              isAuthenticated && user
                ? navigate(getRoleDashboardPath(user.role))
                : navigate("/")
            }
          >
            <LocalHospital color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" color="primary" sx={{ lineHeight: 1.1, fontWeight: 700 }}>
                Healthcare System
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rwanda Hospital Network
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5 }}>
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
            <Button
              color="error"
              size="small"
              variant="outlined"
              onClick={() => navigate("/emergency/triage")}
              startIcon={<Warning fontSize="small" />}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                borderRadius: 2,
                px: 1.5,
                py: 0.4,
                textTransform: "none",
                borderColor: "error.main",
                "&:hover": { bgcolor: "error.main", color: "#fff" },
              }}
            >
              Emergency Triage
            </Button>
          </Box>
        </Box>

        {/* Action Controls & Theme Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isAuthenticated && user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Click to open Navigation Menu">
                <Box
                  onClick={() => setSidebarOpen(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    cursor: "pointer",
                    p: 0.6,
                    px: 1.2,
                    borderRadius: 2.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,121,107,0.04)",
                    transition: "all 0.15s ease-in-out",
                    "&:hover": {
                      bgcolor: "action.hover",
                      borderColor: "primary.main",
                      boxShadow: 1,
                    },
                  }}
                >
                  <Avatar
                    src={user.avatar_url || undefined}
                    alt={user.name}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: "primary.main",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {user.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ fontWeight: 700, textTransform: "capitalize" }}
                    >
                      {user.role?.replace("_", " ")}
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="text" color="inherit" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button variant="contained" color="primary" onClick={() => navigate("/register")}>
                Register
              </Button>
            </Box>
          )}

          <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === "dark" ? <Brightness7 color="warning" /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Slide-out Left Navigation Drawer */}
      {isAuthenticated && user && (
        <SidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
    </AppBar>
  );
};

export default Header;
