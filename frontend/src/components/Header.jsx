import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Chip,
  Button,
} from "@mui/material";
import { Brightness4, Brightness7, LocalHospital } from "@mui/icons-material";
import { useThemeMode } from "../theme/ThemeContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { mode, toggleColorMode } = useThemeMode();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Brand & Hospital Network */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate("/")}>
          <LocalHospital color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" color="primary" sx={{ lineHeight: 1.1, fontWeight: 700 }}>
              Healthcare System
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rwanda Hospital Network • Integrated Care
            </Typography>
          </Box>
        </Box>

        {/* Action Controls & Theme Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`${user.name} (${user.role?.toUpperCase()})`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Button size="small" variant="text" color="inherit" onClick={handleLogout}>
                Logout
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
