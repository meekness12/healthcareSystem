import React from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { getRoleDashboardPath } from "../utils/roles";

/**
 * GuestRoute Guard
 *
 * Ensures that already authenticated users are redirected straight to their
 * clinical role dashboard rather than seeing guest login/registration forms.
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress size={42} thickness={4} color="primary" />
        <Typography variant="body2" color="text.secondary">
          Checking active clinical session...
        </Typography>
      </Box>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return children;
};

export default GuestRoute;
