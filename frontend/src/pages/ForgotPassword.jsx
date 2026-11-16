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
  CircularProgress,
  Stack,
  useTheme,
  LinearProgress,
} from "@mui/material";
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
  LocalHospital,
  ArrowBack,
  CheckCircle,
  VpnKey,
  Key,
  Shield,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/auth";

const ForgotPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Multi-step state: 1 (Request OTP), 2 (Verify OTP), 3 (Set New Password), 4 (Success)
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Resend countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const strength = getPasswordStrength();

  // STEP 1: Request OTP Code
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authApi.forgotPasswordSendOtp(email);
      setSuccessMessage(res.message || "A 6-digit security code has been sent to your email.");
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      console.error("Forgot password OTP request error:", err);
      setError(err.response?.data?.message || "Failed to dispatch verification code. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await authApi.forgotPasswordSendOtp(email);
      setSuccessMessage(res.message || "A fresh 6-digit code has been sent.");
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authApi.forgotPasswordVerifyOtp(email, otpCode.trim());
      setResetToken(res.reset_token);
      setSuccessMessage(res.message || "Code verified successfully! You may now set your new password.");
      setStep(3);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.response?.data?.message || "Invalid or expired security code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authApi.forgotPasswordReset({
        email,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccessMessage(res.message || "Password has been successfully updated!");
      setStep(4);
      setTimeout(() => {
        navigate("/login", { state: { prefillEmail: email } });
      }, 3000);
    } catch (err) {
      console.error("Password reset submission error:", err);
      setError(err.response?.data?.message || "Failed to update password. Your token may have expired.");
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
          maxWidth: 520,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 40px rgba(0,0,0,0.6)"
              : "0 20px 40px rgba(13, 148, 136, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header Ribbon */}
        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.mode === "dark" ? "background.paper" : "#042f2e",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <LocalHospital sx={{ fontSize: 28, color: "#2dd4bf" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#f0fdfa", lineHeight: 1.2 }}>
              Healthcare System Rwanda
            </Typography>
            <Typography variant="caption" sx={{ color: "#99f6e4" }}>
              RP Karongi College Hospital Network • Security Center
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {successMessage && step !== 4 && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 1 && (
            <Box component="form" onSubmit={handleSendOtp}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Reset Your Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter your registered hospital email address. We will send you an official 6-digit verification code.
                </Typography>
              </Box>

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Registered Email Address"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined color="action" />
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
                sx={{ py: 1.5, fontWeight: 700, fontSize: "1rem" }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "primary.contrastText" }} /> : "Send 6-Digit Code"}
              </Button>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Button
                  component={Link}
                  to="/login"
                  startIcon={<ArrowBack />}
                  sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
                >
                  Return to Sign In
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <Box component="form" onSubmit={handleVerifyOtp}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Enter Verification Code
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We sent a 6-digit security code to <strong>{email}</strong>. Enter the code below to proceed.
                </Typography>
              </Box>

              <TextField
                margin="normal"
                required
                fullWidth
                id="otpCode"
                label="6-Digit Verification Code"
                name="otpCode"
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: "center",
                    fontSize: "1.75rem",
                    letterSpacing: "0.5em",
                    fontFamily: "monospace",
                    fontWeight: 800,
                  },
                }}
                placeholder="123456"
                helperText="Code is valid for 10 minutes."
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || otpCode.length !== 6}
                sx={{ py: 1.5, fontWeight: 700, fontSize: "1rem" }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "primary.contrastText" }} /> : "Verify Code"}
              </Button>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
                <Button
                  size="small"
                  onClick={() => setStep(1)}
                  sx={{ textTransform: "none", color: "text.secondary" }}
                >
                  Change Email
                </Button>

                <Button
                  size="small"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 3 && (
            <Box component="form" onSubmit={handleResetPassword}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Set New Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a strong new password for your hospital account.
                </Typography>
              </Box>

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {password && (
                <Box sx={{ my: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Password Strength
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: strength >= 75 ? "success.main" : strength >= 50 ? "warning.main" : "error.main" }}>
                      {strength >= 75 ? "Strong" : strength >= 50 ? "Medium" : "Weak"}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={strength}
                    color={strength >= 75 ? "success" : strength >= 50 ? "warning" : "error"}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                name="passwordConfirmation"
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                id="passwordConfirmation"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                disabled={loading || !password || password !== passwordConfirmation}
                sx={{ py: 1.5, fontWeight: 700, fontSize: "1rem" }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "primary.contrastText" }} /> : "Update Password & Sign In"}
              </Button>
            </Box>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Password Reset Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Your account password has been updated. Redirecting you to the sign-in portal...
              </Typography>
              <Button
                component={Link}
                to="/login"
                state={{ prefillEmail: email }}
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                Sign In Now
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
