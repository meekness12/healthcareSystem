import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from "@mui/material";
import { Close, MarkEmailRead, LocalHospital, CheckCircle } from "@mui/icons-material";
import authApi from "../../api/auth";

const EmailVerificationModal = ({
  open,
  onClose,
  email,
  patientNumber,
  onVerified,
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await authApi.verifyEmailOtp(email, code.trim());
      setSuccess(res.message || "Email verified successfully!");
      setTimeout(() => {
        if (onVerified) onVerified();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await authApi.resendEmailOtp(email);
      setSuccess(res.message || "A fresh code was sent to your email.");
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalHospital color="primary" sx={{ fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Verify Your Email
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ minWidth: 0 }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleVerify}>
        <DialogContent dividers>
          {patientNumber && (
            <Box
              sx={{
                mb: 2.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "action.hover",
                textAlign: "center",
                border: "1px dashed #0d9488",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", fontWeight: 700 }}>
                Assigned Hospital Registration Number
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main", fontFamily: "monospace" }}>
                {patientNumber}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            An official welcome email with your 6-digit verification code has been dispatched to <strong>{email}</strong>.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle fontSize="inherit" />}>
              {success}
            </Alert>
          )}

          <TextField
            label="6-Digit Verification Code"
            required
            fullWidth
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputProps={{
              maxLength: 6,
              style: {
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: "0.4em",
                fontFamily: "monospace",
                fontWeight: 700,
              },
            }}
            placeholder="000000"
            helperText="Code expires in 15 minutes."
          />

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button
              size="small"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Verification Code"}
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Verify Later
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || code.length !== 6}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <MarkEmailRead />}
          >
            Verify Account
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmailVerificationModal;
