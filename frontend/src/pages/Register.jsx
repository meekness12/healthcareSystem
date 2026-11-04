import React, { useState, useEffect } from "react";
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
  Grid,
  MenuItem,
  CircularProgress,
  Divider,
  Stack,
  useTheme,
  FormHelperText,
} from "@mui/material";
import {
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
  BadgeOutlined,
  CalendarMonthOutlined,
  HomeOutlined,
  ContactPhoneOutlined,
  HealthAndSafetyOutlined,
  LocalHospital,
  CheckCircleOutline,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authApi from "../api/auth";

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+250",
    password: "",
    password_confirmation: "",
    dob: "",
    gender: "female",
    national_id: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "+250",
    insurance_provider_id: "",
    insurance_number: "",
    allergies: "",
  });

  // Fetch insurance providers on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchProviders = async () => {
      try {
        const response = await authApi.getInsuranceProviders();
        if (isMounted && response?.data) {
          setInsuranceProviders(response.data);
        }
      } catch (err) {
        console.error("Failed to load insurance providers:", err);
      } finally {
        if (isMounted) setLoadingProviders(false);
      }
    };
    fetchProviders();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    // Client-side pre-validation
    if (formData.password !== formData.password_confirmation) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Prepare payload (convert empty insurance to null)
      const payload = {
        ...formData,
        insurance_provider_id: formData.insurance_provider_id ? Number(formData.insurance_provider_id) : null,
        insurance_number: formData.insurance_number || null,
        national_id: formData.national_id || null,
        allergies: formData.allergies || null,
      };

      await register(payload);
      navigate("/patient/dashboard", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setErrorMessage("Please correct the highlighted errors below.");
      } else {
        setErrorMessage(
          err.response?.data?.message || "Registration failed. Please check network connectivity."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 130px)",
        py: 5,
        px: 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top, #131c2e 0%, #0b0f17 100%)"
            : "radial-gradient(circle at top, #f0fdfa 0%, #f8fafc 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 900,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 40px rgba(0,0,0,0.6)"
              : "0 20px 40px rgba(13, 148, 136, 0.08)",
        }}
      >
        <Box
          sx={{
            p: 4,
            bgcolor: theme.palette.mode === "dark" ? "background.paper" : "#042f2e",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LocalHospital sx={{ fontSize: 40, color: "#2dd4bf" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#f0fdfa" }}>
                Patient Intake & Registration
              </Typography>
              <Typography variant="body2" sx={{ color: "#99f6e4" }}>
                Rwanda Hospital Network • Electronic Health Record (EHR) Enrollment
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: "#e2e8f0", bgcolor: "rgba(255,255,255,0.1)", px: 2, py: 0.8, borderRadius: 2 }}>
            Ministry of Health Standard
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Section 1: Personal & Login Credentials */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleOutline fontSize="small" /> 1. Personal Identity & Account
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Full Name (Official)"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name?.[0] || "e.g., Keza Divine or Kwizera Aimé"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email?.[0]}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="phone"
                  label="Rwandan Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.phone)}
                  helperText={fieldErrors.phone?.[0] || "e.g., +250788123456 or 0788123456"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="national_id"
                  label="Rwandan National ID (NID)"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.national_id)}
                  helperText={fieldErrors.national_id?.[0] || "16 digits starting with 1 (e.g. 1199580012345678)"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="dob"
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.dob)}
                  helperText={fieldErrors.dob?.[0]}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  id="gender"
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Section 2: Residential & Emergency Contacts */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleOutline fontSize="small" /> 2. Address & Emergency Contacts
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="address"
                  label="Residential Address (District, Sector, Cell)"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.address)}
                  helperText={fieldErrors.address?.[0] || "e.g., Karongi, Bwishyura or Kigali, Gasabo, Kimironko"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="emergency_contact_name"
                  label="Emergency Contact Person"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.emergency_contact_name)}
                  helperText={fieldErrors.emergency_contact_name?.[0]}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="emergency_contact_phone"
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.emergency_contact_phone)}
                  helperText={fieldErrors.emergency_contact_phone?.[0] || "e.g. +250788998877"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ContactPhoneOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Section 3: Health Insurance & Allergies */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleOutline fontSize="small" /> 3. Rwandan Health Insurance & Medical Notes
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="insurance_provider_id"
                  label="Health Insurance Scheme"
                  name="insurance_provider_id"
                  value={formData.insurance_provider_id}
                  onChange={handleChange}
                  helperText="Select your insurance for instant co-pay verification"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HealthAndSafetyOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="">
                    <em>Self-Pay / Private (No Insurance)</em>
                  </MenuItem>
                  {insuranceProviders.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.provider_name} ({provider.coverage_percentage}% Coverage)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="insurance_number"
                  label="Insurance Card / Policy Number"
                  name="insurance_number"
                  value={formData.insurance_number}
                  onChange={handleChange}
                  helperText="Required if insurance is selected (e.g. RSSB-2026-12345)"
                  disabled={!formData.insurance_provider_id}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="allergies"
                  label="Known Drug Allergies or Chronic Conditions"
                  name="allergies"
                  multiline
                  rows={2}
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g., Allergic to Penicillin, Asthmatic, Diabetic, etc. (Leave blank if none)"
                />
              </Grid>
            </Grid>

            {/* Section 4: Security Password */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleOutline fontSize="small" /> 4. Portal Access Password
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.password)}
                  helperText={
                    fieldErrors.password?.[0] ||
                    "Min 8 chars with uppercase, number & symbol (@$!%*?&#)"
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password_confirmation"
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  id="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  helperText="Retype password to confirm"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.8,
                fontWeight: 700,
                fontSize: "1.05rem",
              }}
            >
              {loading ? (
                <CircularProgress size={26} sx={{ color: "primary.contrastText" }} />
              ) : (
                "Complete Patient Registration & Enter Portal"
              )}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Already registered with our hospital network?{" "}
                <Link
                  to="/login"
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Sign In to Your Account
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
