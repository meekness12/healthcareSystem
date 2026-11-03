import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "Admin", role: "admin" };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Box sx={{ p: 3, bgcolor: "#fff", borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom>
          Welcome, {user.name}
        </Typography>
        <Typography color="text.secondary">
          System administration, user management, and audit logs.
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
