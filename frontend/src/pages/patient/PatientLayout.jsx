import React from "react";
import { Box, Typography, Drawer, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";

const PatientLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Patient", role: "patient" };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <Box sx={{ p: 2, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
          <Typography variant="h6">{user.name}</Typography>
          <Typography variant="body2">{user.role.toUpperCase()}</Typography>
        </Box>
        <Divider />
        <List>
          <ListItemButton onClick={() => navigate("/patient/dashboard")}>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/patient/appointments")}>
            <ListItemText primary="Appointments" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/patient/records")}>
            <ListItemText primary="Medical Records" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/patient/book-appointment")}>
            <ListItemText primary="Book Appointment" />
          </ListItemButton>
          <ListItemButton onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, bgcolor: "#f4f6f8", overflowY: "auto" }}>
        {children}
      </Box>
    </Box>
  );
};

export default PatientLayout;
