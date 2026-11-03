// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    // Not logged in
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Logged in but wrong role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" />;
      case "doctor":
        return <Navigate to="/doctor/dashboard" />;
      case "patient":
        return <Navigate to="/patient/dashboard" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  // User has correct role
  return children;
};

export default ProtectedRoute;
