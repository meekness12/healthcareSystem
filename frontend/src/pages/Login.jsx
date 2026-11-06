import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Stack,
  useTheme,
} from "@mui/material";
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
  LocalHospital,
  Security,
  VerifiedUser,
  FlashOn,
  Domain,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Patient", email: "keza.divine@gmail.com", label: "Patient (Keza Divine)", color: "primary" },
  { role: "Doctor", email: "dr.gasana@hospital.rw", label: "Doctor (Dr. Gasana)", color: "secondary" },
  { role: "Admin", email: "admin@hospital.rw", label: "System Admin", color: "error" },
  { role: "Lab Tech", email: "lab.karongi@hospital.rw", label: "Lab Technician", color: "info" },
  { role: "Pharmacist", email: "pharma.karongi@hospital.rw", label: "Pharmacist", color: "success" },
  { role: "Billing", email: "billing.karongi@hospital.rw", label: "Billing Officer", color: "warning" },
];

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleDemoSelect = (demo) => {
    setFormData({
      email: demo.email,
      password: "Password123!",
    });
    setSelectedDemoRole(demo.role);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);

      // Check if redirect path was stored in route state
      const redirectPath = location.state?.from?.pathname;
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }

      // Intelligent role-based landing redirect
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "doctor":
          navigate("/doctor/dashboard", { replace: true });
          break;
        case "patient":
          navigate("/patient/dashboard", { replace: true });
          break;
        case "lab_technician":
          navigate("/lab/dashboard", { replace: true });
          break;
        case "pharmacist":
          navigate("/pharmacy/dashboard", { replace: true });
          break;
        case "billing_officer":
          navigate("/billing/dashboard", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login submission error:", err);
      const backendMessage =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        "Invalid credentials or connection issue. Please try again.";
      setErrorMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 130px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top, #131c2e 0%, #0b0f17 100%)"
            : "radial-gradient(circle at top, #f0fdfa 0%, #f8fafc 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1040,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          overflow: "hidden",
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 40px rgba(0,0,0,0.6)"
              : "0 20px 40px rgba(13, 148, 136, 0.08)",
        }}
      >
        {/* Left Hero Brand Panel (Hidden on mobile) */}
        <Box
          sx={{
            flex: 1.1,
            p: { xs: 4, md: 6 },
            bgcolor: theme.palette.mode === "dark" ? "background.paper" : "#042f2e",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: { md: `1px solid ${theme.palette.divider}` },
            position: "relative",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <LocalHospital sx={{ fontSize: 36, color: "#2dd4bf" }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em", color: "#f0fdfa" }}>
                  Healthcare System
                </Typography>
                <Typography variant="caption" sx={{ color: "#99f6e4", fontWeight: 500 }}>
                  Rwanda National Hospital Network
                </Typography>
              </Box>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mt: 3, mb: 2, lineHeight: 1.2 }}>
              Secure Clinical Care & Patient Record Portal
            </Typography>

            <Typography variant="body2" sx={{ color: "#ccfbf1", mb: 4, lineHeight: 1.6 }}>
              Integrated digital health infrastructure serving Western, Kigali, Southern, Northern, and
              Eastern Provincial Teaching & District Hospitals.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <VerifiedUser sx={{ color: "#34d399", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#e2e8f0" }}>
                  RSSB / RAMA, CBHI (Mutuelle), & MMI Insurance Integration
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Security sx={{ color: "#38bdf8", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#e2e8f0" }}>
                  Multi-Role Hospital Access Control (6 Clinical Roles)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Domain sx={{ color: "#fbbf24", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "#e2e8f0" }}>
                  Real-time Multi-Branch Bed & Doctor Schedule Sync
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ pt: 3, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
              RP Karongi College • Integrated Healthcare Information Network
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Republic of Rwanda • Ministry of Health Compliant
            </Typography>
          </Box>
        </Box>

        {/* Right Authentication Form */}
        <Box sx={{ flex: 1.2, p: { xs: 3, sm: 5, md: 6 }, bgcolor: "background.paper" }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Sign In to Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your official credentials or use 1-click quick role selection.
            </Typography>
          </Box>

          {/* 1-Click Quick Role Selection Section */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(13,148,136,0.04)",
              border: `1px dashed ${theme.palette.primary.main}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <FlashOn color="primary" sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>
                1-Click Quick Role Selector (Demonstration & Assessment Access)
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {DEMO_ACCOUNTS.map((demo) => (
                <Chip
                  key={demo.role}
                  label={demo.role}
                  size="small"
                  clickable
                  color={selectedDemoRole === demo.role ? demo.color : "default"}
                  variant={selectedDemoRole === demo.role ? "filled" : "outlined"}
                  onClick={() => handleDemoSelect(demo)}
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
              ))}
            </Box>
            {selectedDemoRole && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Loaded credentials for <strong>{selectedDemoRole}</strong>. Click "Sign In" below.
              </Typography>
            )}
          </Box>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                position: "relative",
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "primary.contrastText" }} />
              ) : (
                "Sign In"
              )}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Are you a new patient seeking medical care?{" "}
                <Link
                  to="/register"
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Register Here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;
