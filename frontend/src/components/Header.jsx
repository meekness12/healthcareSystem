import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Chip,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  LocalHospital,
  AccountCircle,
  Settings,
  Logout,
  Dashboard,
} from "@mui/icons-material";
import { useThemeMode } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { mode, toggleColorMode } = useThemeMode();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleCloseMenu();
    navigate("/profile");
  };

  const handleDashboardClick = () => {
    handleCloseMenu();
    if (!user) {
      navigate("/login");
      return;
    }
    switch (user.role) {
      case "admin":
        navigate("/admin/dashboard");
        break;
      case "doctor":
        navigate("/doctor/dashboard");
        break;
      case "patient":
        navigate("/patient/dashboard");
        break;
      case "lab_technician":
        navigate("/lab/dashboard");
        break;
      case "pharmacist":
        navigate("/pharmacy/dashboard");
        break;
      case "billing_officer":
        navigate("/billing/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  const handleLogout = async () => {
    handleCloseMenu();
    await logout();
    navigate("/login");
  };

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
            onClick={() => (isAuthenticated ? handleDashboardClick() : navigate("/"))}
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

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
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
        </Box>

        {/* Action Controls & Theme Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isAuthenticated && user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Open User Menu">
                <Box
                  onClick={handleOpenMenu}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    p: 0.5,
                    borderRadius: 2,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Avatar
                    src={user.avatar_url || undefined}
                    alt={user.name}
                    sx={{
                      width: 36,
                      height: 36,
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
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                      {user.role}
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={openMenu}
                onClose={handleCloseMenu}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    minWidth: 200,
                    borderRadius: 2,
                    mt: 1.5,
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                    {user.email}
                  </Typography>
                  <Chip
                    label={user.role?.toUpperCase()}
                    color="primary"
                    size="small"
                    sx={{ mt: 1, fontWeight: 700, fontSize: "0.7rem" }}
                  />
                </Box>
                <Divider />

                <MenuItem onClick={handleDashboardClick}>
                  <ListItemIcon>
                    <Dashboard fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </MenuItem>

                <MenuItem onClick={handleProfileClick}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Profile & Settings" />
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Sign Out" />
                </MenuItem>
              </Menu>
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
    </AppBar>
  );
};

export default Header;
