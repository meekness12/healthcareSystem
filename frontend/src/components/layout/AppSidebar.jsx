import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Switch,
  Tooltip,
  useTheme,
  Stack,
  Badge,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Dashboard,
  BookOnline,
  EventNote,
  HistoryEdu,
  ReceiptLong,
  EventAvailable,
  Warning,
  People,
  Security,
  TrendingUp,
  Domain,
  Science,
  LocalPharmacy,
  Payments,
  LocalHospital,
  Settings,
  Logout,
  Brightness4,
  Brightness7,
  Close,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../theme/ThemeContext";
import { getRoleDashboardPath, getRoleLabel, getRoleColor } from "../../utils/roles";

export const EXPANDED_WIDTH = 260;
export const COLLAPSED_WIDTH = 72;

const AppSidebar = ({ isCollapsed, onToggleCollapse, mobileOpen, onMobileClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  if (!user) return null;

  const handleNavigate = (path) => {
    if (!isDesktop && onMobileClose) {
      onMobileClose();
    }
    navigate(path);
  };

  const handleLogout = async () => {
    if (!isDesktop && onMobileClose) {
      onMobileClose();
    }
    await logout();
    navigate("/login", { replace: true });
  };

  // Define role-specific navigation links
  const getRoleNavItems = () => {
    switch (user.role) {
      case "patient":
        return [
          { label: "Patient Dashboard", path: "/patient/dashboard", icon: <Dashboard fontSize="small" /> },
          { label: "Book Appointment", path: "/patient/book-appointment", icon: <BookOnline fontSize="small" /> },
          { label: "My Appointments", path: "/patient/appointments", icon: <EventNote fontSize="small" /> },
          { label: "Medical Records (EHR)", path: "/patient/records", icon: <HistoryEdu fontSize="small" /> },
          { label: "Invoices & Billing", path: "/patient/billing", icon: <ReceiptLong fontSize="small" /> },
        ];
      case "doctor":
        return [
          { label: "Doctor Dashboard", path: "/doctor/dashboard", icon: <Dashboard fontSize="small" /> },
          { label: "Appointments Queue", path: "/doctor/appointments", icon: <EventNote fontSize="small" /> },
          { label: "Availability Schedule", path: "/doctor/schedule", icon: <EventAvailable fontSize="small" /> },
          { label: "Emergency Triage", path: "/emergency/triage", icon: <Warning fontSize="small" color="error" /> },
        ];
      case "admin":
        return [
          { label: "Executive Dashboard", path: "/admin/dashboard", icon: <Dashboard fontSize="small" /> },
          { label: "Staff & User Governance", path: "/admin/users", icon: <People fontSize="small" /> },
          { label: "Security & Audit Trail", path: "/admin/audit-logs", icon: <Security fontSize="small" /> },
          { label: "Reports & Analytics", path: "/admin/reports", icon: <TrendingUp fontSize="small" /> },
          { label: "Hospital Branches", path: "/branches", icon: <Domain fontSize="small" /> },
          { label: "Specialist Directory", path: "/doctors", icon: <LocalHospital fontSize="small" /> },
        ];
      case "lab_technician":
        return [
          { label: "Laboratory Workspace", path: "/lab/dashboard", icon: <Science fontSize="small" /> },
        ];
      case "pharmacist":
        return [
          { label: "Dispensary Console", path: "/pharmacy/dashboard", icon: <LocalPharmacy fontSize="small" /> },
        ];
      case "billing_officer":
        return [
          { label: "Billing & Revenue Console", path: "/billing/dashboard", icon: <Payments fontSize="small" /> },
        ];
      default:
        return [
          { label: "My Dashboard", path: getRoleDashboardPath(user.role), icon: <Dashboard fontSize="small" /> },
        ];
    }
  };

  const roleNavItems = getRoleNavItems();
  const roleColor = getRoleColor(user.role);

  // Reusable Sidebar Content
  const sidebarContent = (collapsed) => (
    <Box
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.mode === "dark" ? "#0b101b" : "#ffffff",
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: "width 200ms cubic-bezier(0.2, 0, 0, 1)",
        overflowX: "hidden",
      }}
    >
      {/* 1. Brand Logo & Collapse Toggle */}
      <Box
        sx={{
          height: 64,
          minHeight: 64,
          px: collapsed ? 1.5 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            cursor: "pointer",
            overflow: "hidden",
          }}
          onClick={() => handleNavigate(getRoleDashboardPath(user.role))}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
            }}
          >
            <LocalHospital sx={{ fontSize: 20 }} />
          </Box>

          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  color: "text.primary",
                }}
              >
                Healthcare System
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: "0.68rem",
                  color: "text.secondary",
                  display: "block",
                  fontWeight: 500,
                }}
              >
                Rwanda Hospital Network
              </Typography>
            </Box>
          )}
        </Box>

        {/* Toggle Minimize/Expand Button (Desktop only) */}
        {isDesktop && (
          <Tooltip title={collapsed ? "Expand sidebar" : "Minimize sidebar"} placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                color: "text.secondary",
                ml: collapsed ? 0 : 1,
                "&:hover": {
                  color: "primary.main",
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              {collapsed ? <ChevronRight sx={{ fontSize: 18 }} /> : <ChevronLeft sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        )}

        {/* Close Button on Mobile */}
        {!isDesktop && (
          <IconButton size="small" onClick={onMobileClose} sx={{ color: "text.secondary" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Box>

      {/* 2. User Profile Tile */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.02)"
              : "rgba(5, 150, 105, 0.02)",
        }}
      >
        {collapsed ? (
          <Tooltip title={`${user.name} (${getRoleLabel(user.role)})`} placement="right">
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#10b981",
                    color: "#10b981",
                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                  },
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
              </Badge>
            </Box>
          </Tooltip>
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: "#10b981",
                  color: "#10b981",
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                },
              }}
            >
              <Avatar
                src={user.avatar_url || undefined}
                alt={user.name}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "primary.main",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: 1,
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>
            </Badge>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {user.email}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.5 }}>
                <Chip
                  label={getRoleLabel(user.role).toUpperCase()}
                  color={roleColor === "default" ? "primary" : roleColor}
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: "0.65rem",
                    height: 18,
                    letterSpacing: "0.02em",
                  }}
                />
                {user.patient_number && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.68rem",
                      bgcolor: "action.hover",
                      px: 0.6,
                      borderRadius: 0.8,
                      color: "text.secondary",
                    }}
                  >
                    {user.patient_number}
                  </Typography>
                )}
              </Box>
            </Box>
          </Stack>
        )}
      </Box>

      {/* 3. Navigation List (Scrollable) */}
      <Box sx={{ flex: 1, overflowY: "auto", px: collapsed ? 1 : 1.5, py: 2 }}>
        {/* Section: Clinical Workspace */}
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              mb: 1,
              display: "block",
              fontWeight: 750,
              letterSpacing: "0.06em",
              color: "text.secondary",
              fontSize: "0.65rem",
              textTransform: "uppercase",
            }}
          >
            Clinical Workspace
          </Typography>
        )}

        <List disablePadding sx={{ mb: 2 }}>
          {roleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const buttonNode = (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1,
                  px: collapsed ? 0 : 1.5,
                  justifyContent: collapsed ? "center" : "flex-start",
                  position: "relative",
                  transition: "all 0.15s cubic-bezier(0.2, 0, 0, 1)",
                  "&.Mui-selected": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(16, 185, 129, 0.14)"
                        : "rgba(5, 150, 105, 0.08)",
                    color: "primary.main",
                    fontWeight: 700,
                    "& .MuiListItemIcon-root": {
                      color: "primary.main",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: "20%",
                      bottom: "20%",
                      width: 3,
                      borderRadius: "0 2px 2px 0",
                      bgcolor: "primary.main",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? "auto" : 34,
                    color: isActive ? "primary.main" : "text.secondary",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.84rem",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            );

            return collapsed ? (
              <Tooltip key={item.path} title={item.label} placement="right">
                {buttonNode}
              </Tooltip>
            ) : (
              buttonNode
            );
          })}
        </List>

        <Divider sx={{ my: 1.5, mx: collapsed ? 0.5 : 1 }} />

        {/* Section: Hospital Network */}
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              mb: 1,
              display: "block",
              fontWeight: 750,
              letterSpacing: "0.06em",
              color: "text.secondary",
              fontSize: "0.65rem",
              textTransform: "uppercase",
            }}
          >
            Hospital Network
          </Typography>
        )}

        <List disablePadding sx={{ mb: 2 }}>
          {[
            { label: "Hospital Branches", path: "/branches", icon: <Domain fontSize="small" /> },
            { label: "Specialist Directory", path: "/doctors", icon: <LocalHospital fontSize="small" /> },
            { label: "Emergency Triage", path: "/emergency/triage", icon: <Warning fontSize="small" color="error" /> },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            const buttonNode = (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 0.9,
                  px: collapsed ? 0 : 1.5,
                  justifyContent: collapsed ? "center" : "flex-start",
                  "&.Mui-selected": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(16, 185, 129, 0.14)"
                        : "rgba(5, 150, 105, 0.08)",
                    color: "primary.main",
                    fontWeight: 700,
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? "auto" : 34,
                    color: item.label === "Emergency Triage" ? "error.main" : "text.secondary",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.84rem",
                      fontWeight: isActive ? 700 : 500,
                      color: item.label === "Emergency Triage" ? "error.main" : "text.primary",
                    }}
                  />
                )}
              </ListItemButton>
            );

            return collapsed ? (
              <Tooltip key={item.path} title={item.label} placement="right">
                {buttonNode}
              </Tooltip>
            ) : (
              buttonNode
            );
          })}
        </List>

        <Divider sx={{ my: 1.5, mx: collapsed ? 0.5 : 1 }} />

        {/* Section: Settings & Theme */}
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              mb: 1,
              display: "block",
              fontWeight: 750,
              letterSpacing: "0.06em",
              color: "text.secondary",
              fontSize: "0.65rem",
              textTransform: "uppercase",
            }}
          >
            Preferences
          </Typography>
        )}

        <List disablePadding>
          {/* Profile link */}
          {collapsed ? (
            <Tooltip title="Account Settings" placement="right">
              <ListItemButton
                onClick={() => handleNavigate("/profile")}
                selected={location.pathname === "/profile"}
                sx={{ borderRadius: 2, mb: 0.5, py: 0.9, justifyContent: "center" }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: "text.secondary", justifyContent: "center" }}>
                  <Settings fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton
              onClick={() => handleNavigate("/profile")}
              selected={location.pathname === "/profile"}
              sx={{ borderRadius: 2, mb: 0.5, py: 0.9, px: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: "text.secondary" }}>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Account Settings"
                primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 500 }}
              />
            </ListItemButton>
          )}

          {/* Theme Toggle */}
          {collapsed ? (
            <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`} placement="right">
              <ListItemButton
                onClick={toggleColorMode}
                sx={{ borderRadius: 2, mb: 0.5, py: 0.9, justifyContent: "center" }}
              >
                <ListItemIcon sx={{ minWidth: "auto", color: mode === "dark" ? "warning.main" : "text.secondary" }}>
                  {mode === "dark" ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                {mode === "dark" ? (
                  <Brightness7 fontSize="small" color="warning" />
                ) : (
                  <Brightness4 fontSize="small" color="action" />
                )}
                <Typography variant="body2" sx={{ fontSize: "0.84rem", fontWeight: 500 }}>
                  Dark Appearance
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={mode === "dark"}
                onChange={toggleColorMode}
                inputProps={{ "aria-label": "Toggle Dark Mode" }}
              />
            </Box>
          )}
        </List>
      </Box>

      {/* 4. Footer Actions & Session Logout */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.01)"
              : "rgba(0, 0, 0, 0.01)",
        }}
      >
        {collapsed ? (
          <Tooltip title="Sign Out of Session" placement="right">
            <IconButton
              color="error"
              onClick={handleLogout}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                border: "1px solid rgba(220, 38, 38, 0.3)",
                mx: "auto",
                display: "flex",
                "&:hover": { bgcolor: "error.main", color: "#ffffff" },
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleLogout}
              startIcon={<Logout />}
              sx={{
                py: 0.9,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                borderColor: "rgba(220, 38, 38, 0.35)",
                "&:hover": {
                  bgcolor: "error.main",
                  color: "#ffffff",
                  borderColor: "error.main",
                },
              }}
            >
              Sign Out
            </Button>
            <Box sx={{ mt: 1.5, textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ fontSize: "0.66rem", color: "text.secondary", display: "block", fontWeight: 600 }}
              >
                Republic of Rwanda • MoH
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: "0.62rem", color: "text.disabled", display: "block" }}
              >
                Healthcare System v2.6.4
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );

  // If on desktop, render fixed docked sidebar
  if (isDesktop) {
    return (
      <Box
        component="aside"
        sx={{
          width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: (t) => t.zIndex.drawer + 2,
          transition: "width 200ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {sidebarContent(isCollapsed)}
      </Box>
    );
  }

  // On mobile, render off-canvas temporary drawer
  return (
    <Drawer
      anchor="left"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: EXPANDED_WIDTH,
          boxShadow: theme.shadows[16],
        },
      }}
    >
      {sidebarContent(false)}
    </Drawer>
  );
};

export default AppSidebar;
