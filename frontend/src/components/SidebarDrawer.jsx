import React from "react";
import {
  Drawer,
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
  useTheme,
  Stack,
  Badge,
} from "@mui/material";
import {
  Close,
  ChevronLeft,
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
  VerifiedUser,
  PersonOutline,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../theme/ThemeContext";
import { getRoleDashboardPath, getRoleLabel, getRoleColor } from "../utils/roles";

const DRAWER_WIDTH = 320;

const SidebarDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();

  if (!user) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
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
          { label: "Emergency Triage Queue", path: "/emergency/triage", icon: <Warning fontSize="small" color="error" /> },
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

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          boxShadow: theme.shadows[16],
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* 1. Header & Close Bar */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,121,107,0.04)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <LocalHospital color="primary" sx={{ fontSize: 26 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1, color: "primary.main" }}>
              Healthcare System
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>
              Rwanda Hospital Network
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          <ChevronLeft />
        </IconButton>
      </Box>

      {/* 2. User Profile Hero Card */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)"
              : "linear-gradient(180deg, rgba(0,121,107,0.06) 0%, rgba(255,255,255,0) 100%)",
        }}
      >
        <Stack direction="row" spacing={1.75} alignItems="center">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: "#4caf50",
                color: "#4caf50",
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                width: 10,
                height: 10,
                borderRadius: "50%",
              },
            }}
          >
            <Avatar
              src={user.avatar_url || undefined}
              alt={user.name}
              sx={{
                width: 52,
                height: 52,
                bgcolor: "primary.main",
                fontSize: "1.25rem",
                fontWeight: 700,
                boxShadow: 2,
              }}
            >
              {user.name?.charAt(0)}
            </Avatar>
          </Badge>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mb: 0.5 }}>
              {user.email}
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
              <Chip
                label={getRoleLabel(user.role).toUpperCase()}
                color={roleColor === "default" ? "primary" : roleColor}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  height: 20,
                  textTransform: "uppercase",
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
                    py: 0.1,
                    borderRadius: 1,
                    color: "text.secondary",
                  }}
                >
                  {user.patient_number}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 2,
            pt: 1.2,
            borderTop: `1px dashed ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
            Branch Affiliation:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.72rem" }}>
            RP Karongi Teaching & Provincial
          </Typography>
        </Box>
      </Box>

      {/* 3. Navigation List (Scrollable Body) */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 2 }}>
        {/* Role Navigation */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: "block",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "text.secondary",
            fontSize: "0.68rem",
            textTransform: "uppercase",
          }}
        >
          Clinical Workspace
        </Typography>

        <List disablePadding sx={{ mb: 2 }}>
          {roleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1,
                  px: 1.5,
                  transition: "all 0.15s ease-in-out",
                  "&.Mui-selected": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(0,150,136,0.18)"
                        : "rgba(0,121,107,0.1)",
                    color: "primary.main",
                    fontWeight: 700,
                    "& .MuiListItemIcon-root": {
                      color: "primary.main",
                    },
                    "&:hover": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(0,150,136,0.25)"
                          : "rgba(0,121,107,0.16)",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? "primary.main" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.86rem",
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ my: 1.5 }} />

        {/* General Hospital Services */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: "block",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "text.secondary",
            fontSize: "0.68rem",
            textTransform: "uppercase",
          }}
        >
          Hospital Network
        </Typography>

        <List disablePadding sx={{ mb: 2 }}>
          <ListItemButton
            onClick={() => handleNavigate("/branches")}
            selected={location.pathname === "/branches"}
            sx={{ borderRadius: 2, mb: 0.5, py: 0.9, px: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
              <Domain fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Hospital Branches"
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => handleNavigate("/doctors")}
            selected={location.pathname === "/doctors"}
            sx={{ borderRadius: 2, mb: 0.5, py: 0.9, px: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
              <LocalHospital fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Specialist Directory"
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => handleNavigate("/emergency/triage")}
            selected={location.pathname === "/emergency/triage"}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 0.9,
              px: 1.5,
              color: "error.main",
              "& .MuiListItemIcon-root": { color: "error.main" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Warning fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Emergency Triage"
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
            />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 1.5 }} />

        {/* Account & Settings */}
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: "block",
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "text.secondary",
            fontSize: "0.68rem",
            textTransform: "uppercase",
          }}
        >
          Preferences & Security
        </Typography>

        <List disablePadding>
          <ListItemButton
            onClick={() => handleNavigate("/profile")}
            selected={location.pathname === "/profile"}
            sx={{ borderRadius: 2, mb: 0.5, py: 0.9, px: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Account & Settings"
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
            />
          </ListItemButton>

          {/* Theme Mode Toggle Row */}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {mode === "dark" ? (
                <Brightness7 fontSize="small" color="warning" />
              ) : (
                <Brightness4 fontSize="small" color="action" />
              )}
              <Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
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
        </List>
      </Box>

      {/* 4. Bottom Actions & Session Termination */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleLogout}
          startIcon={<Logout />}
          sx={{
            py: 1,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: "0.85rem",
            textTransform: "none",
            borderColor: "rgba(211, 47, 47, 0.4)",
            "&:hover": {
              bgcolor: "error.main",
              color: "#fff",
              borderColor: "error.main",
            },
          }}
        >
          Sign Out of Session
        </Button>

        <Box sx={{ mt: 1.75, textAlign: "center" }}>
          <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary", display: "block" }}>
            Republic of Rwanda • MoH Compliant
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "text.disabled", display: "block" }}>
            Healthcare System v2.6.4 • RP Karongi
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SidebarDrawer;
