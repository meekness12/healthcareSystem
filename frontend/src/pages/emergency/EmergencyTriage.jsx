import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Warning,
  LocalHospital,
  Speed,
  Favorite,
  DeviceThermostat,
  Air,
  CheckCircle,
  Phone,
  QrCode2,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import branchApi from "../../api/branch";
import appointmentApi from "../../api/appointment";

const EmergencyTriage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [formData, setFormData] = useState({
    branch_id: "",
    triage_level: "level_2_emergency",
    symptoms: "",
    walk_in_name: "",
    walk_in_phone: "+250",
    vital_signs: {
      blood_pressure: "",
      heart_rate: "",
      temperature: "",
      spo2: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [triageSuccess, setTriageSuccess] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadBranches = async () => {
      try {
        const res = await branchApi.getBranches();
        if (isMounted && res?.data) {
          setBranches(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, branch_id: res.data[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    };
    loadBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrorMessage("");
  };

  const handleVitalChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      vital_signs: { ...prev.vital_signs, [field]: val },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.branch_id) {
      setErrorMessage("Please select the hospital emergency branch.");
      return;
    }

    if (!formData.symptoms.trim()) {
      setErrorMessage("Please describe the acute symptoms or emergency reason.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        branch_id: Number(formData.branch_id),
        triage_level: formData.triage_level,
        symptoms: formData.symptoms.trim(),
        walk_in_name: formData.walk_in_name.trim() || undefined,
        walk_in_phone: formData.walk_in_phone.trim() || undefined,
        vital_signs: {
          blood_pressure: formData.vital_signs.blood_pressure.trim() || undefined,
          heart_rate: formData.vital_signs.heart_rate ? Number(formData.vital_signs.heart_rate) : undefined,
          temperature: formData.vital_signs.temperature ? Number(formData.vital_signs.temperature) : undefined,
          spo2: formData.vital_signs.spo2 ? Number(formData.vital_signs.spo2) : undefined,
        },
      };

      const res = await appointmentApi.emergencyTriage(payload);
      setTriageSuccess(res);
    } catch (err) {
      console.error("Emergency triage error:", err);
      setErrorMessage(
        err.response?.data?.message || "Emergency intake failed. Please notify triage desk immediately."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Red Alert Header */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          bgcolor: theme.palette.mode === "dark" ? "#2d1215" : "#fef2f2",
          border: "2px solid #ef4444",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Warning sx={{ fontSize: 44, color: "#ef4444" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#b91c1c" }}>
                Emergency & Acute Triage Fast-Track
              </Typography>
              <Typography variant="body2" sx={{ color: "#991b1b" }}>
                High-priority hospital admission. Automatically bypasses standard consultation queues and alerts on-duty medical resuscitation teams.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* Form */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              1. Hospital Branch & Acuity Classification
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Emergency Hospital Branch"
                  value={formData.branch_id}
                  onChange={(e) => handleChange("branch_id", e.target.value)}
                  disabled={loadingBranches}
                >
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.branch_name} ({b.province})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Triage Acuity Level"
                  value={formData.triage_level}
                  onChange={(e) => handleChange("triage_level", e.target.value)}
                >
                  <MenuItem value="level_1_resuscitation">Level 1: Resuscitation (Immediate Life Threat)</MenuItem>
                  <MenuItem value="level_2_emergency">Level 2: Emergency (Severe Distress / Acute Risk)</MenuItem>
                  <MenuItem value="level_3_urgent">Level 3: Urgent (High Risk / Severe Pain)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              2. Emergency Symptoms & Acute Complaint
            </Typography>

            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Primary Emergency Symptoms"
              placeholder="e.g. Acute chest pain, shortness of breath, severe trauma, loss of consciousness..."
              value={formData.symptoms}
              onChange={(e) => handleChange("symptoms", e.target.value)}
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              3. Initial Vital Signs (If Measured)
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Blood Pressure"
                  placeholder="e.g. 120/80"
                  value={formData.vital_signs.blood_pressure}
                  onChange={(e) => handleVitalChange("blood_pressure", e.target.value)}
                  InputProps={{
                    startAdornment: <Speed fontSize="small" color="action" sx={{ mr: 0.5 }} />,
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pulse / Heart Rate"
                  placeholder="bpm"
                  type="number"
                  value={formData.vital_signs.heart_rate}
                  onChange={(e) => handleVitalChange("heart_rate", e.target.value)}
                  InputProps={{
                    startAdornment: <Favorite fontSize="small" color="error" sx={{ mr: 0.5 }} />,
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Temperature"
                  placeholder="°C"
                  type="number"
                  value={formData.vital_signs.temperature}
                  onChange={(e) => handleVitalChange("temperature", e.target.value)}
                  InputProps={{
                    startAdornment: <DeviceThermostat fontSize="small" color="warning" sx={{ mr: 0.5 }} />,
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="SpO2 Oxygen"
                  placeholder="%"
                  type="number"
                  value={formData.vital_signs.spo2}
                  onChange={(e) => handleVitalChange("spo2", e.target.value)}
                  InputProps={{
                    startAdornment: <Air fontSize="small" color="info" sx={{ mr: 0.5 }} />,
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="error"
              size="large"
              disabled={submitting}
              sx={{ py: 1.8, fontWeight: 800, fontSize: "1.05rem" }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : "Dispatch Emergency Triage Alert"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Triage Token Dialog */}
      <Dialog
        open={Boolean(triageSuccess)}
        onClose={() => {
          setTriageSuccess(null);
          navigate("/patient/appointments");
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: "center", color: "error.main" }}>
          <CheckCircle sx={{ fontSize: 50, color: "error.main", mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Emergency Priority Token
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            TOKEN NUMBER
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "error.main", my: 1 }}>
            {triageSuccess?.queue_token}
          </Typography>
          <Chip label={triageSuccess?.triage_level} color="error" sx={{ fontWeight: 800, mb: 2 }} />

          <Alert severity="info" sx={{ textAlign: "left" }}>
            Assigned to: <strong>{triageSuccess?.data?.doctor?.name}</strong> at{" "}
            <strong>{triageSuccess?.data?.branch?.branch_name}</strong>. Proceed directly to Emergency Reception.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setTriageSuccess(null);
              navigate("/patient/appointments");
            }}
            sx={{ fontWeight: 700 }}
          >
            Acknowledge & Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmergencyTriage;
