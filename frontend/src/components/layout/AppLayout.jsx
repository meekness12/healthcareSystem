import React, { useState, useEffect } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import Header from "../Header";
import Footer from "../Footer";

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Retrieve persistent collapse preference from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("healthcare_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("healthcare_sidebar_collapsed", isCollapsed ? "true" : "false");
    } catch (e) {
      console.warn("Failed to persist sidebar state:", e);
    }
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* 1. Persistent Fixed Sidebar */}
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* 2. Main Layout Container (Header + Content + Footer) */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <Header onMobileMenuClick={handleMobileToggle} isInsideLayout={true} />

        <Box component="main" sx={{ flexGrow: 1 }}>
          {children || <Outlet />}
        </Box>

        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;
