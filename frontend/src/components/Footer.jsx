import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box component="footer" sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5", mt: "auto" }}>
      <Typography variant="body2" color="text.secondary">
        &copy; {new Date().getFullYear()} Healthcare System. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
