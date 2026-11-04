import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import {
  AccessTime,
  EventAvailable,
  Save,
  FlashOn,
  CheckCircle,
  WarningAmber,
  LocalHospital,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import doctorApi from "../../api/doctor";
import scheduleApi from "../../api/schedule";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DoctorScheduleManager = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [doctorStatus, setDoctorStatus] = useState("active");
  const [schedules, setSchedules] = useState({
    monday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
    tuesday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
    wednesday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
    thursday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
    friday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
    saturday: { enabled: false, start_time: "09:00", end_time: "13:00", slot_duration_minutes: 30 },
    sunday: { enabled: false, start_time: "09:00", end_time: "13:00", slot_duration_minutes: 30 },
  });

  // Fetch doctor's existing schedule on mount
  useEffect(() => {
    let isMounted = true;
    const loadSchedule = async () => {
      if (!user?.doctor?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await doctorApi.getDoctorSchedules(user.doctor.id);
        if (isMounted && res?.schedules) {
          if (res.status) setDoctorStatus(res.status);

          const updated = { ...schedules };
          res.schedules.forEach((item) => {
            const day = item.day_of_week?.toLowerCase();
            if (updated[day]) {
              updated[day] = {
                enabled: item.status === "active",
                start_time: item.start_time || "08:00",
                end_time: item.end_time || "16:00",
                slot_duration_minutes: item.slot_duration_minutes || 30,
              };
            }
          });
          setSchedules(updated);
        }
      } catch (err) {
        console.error("Failed to load doctor schedule:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggleDay = (dayKey) => {
    setSchedules((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled },
    }));
    setSuccessMessage("");
  };

  const handleFieldChange = (dayKey, field, value) => {
    setSchedules((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
    setSuccessMessage("");
  };

  // 1-Click Template: Standard Mon-Fri 08:00 to 16:00
  const handleApplyMonFriPreset = () => {
    setSchedules({
      monday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
      tuesday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
      wednesday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
      thursday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
      friday: { enabled: true, start_time: "08:00", end_time: "16:00", slot_duration_minutes: 30 },
      saturday: { enabled: false, start_time: "09:00", end_time: "13:00", slot_duration_minutes: 30 },
      sunday: { enabled: false, start_time: "09:00", end_time: "13:00", slot_duration_minutes: 30 },
    });
    setSuccessMessage("Preset applied! Remember to click 'Save Availability'.");
  };

  // Submit schedule to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const scheduleArray = Object.entries(schedules).map(([day, config]) => ({
        day_of_week: day,
        start_time: config.start_time,
        end_time: config.end_time,
        slot_duration_minutes: Number(config.slot_duration_minutes),
        status: config.enabled ? "active" : "inactive",
      }));

      await scheduleApi.updateMySchedule({
        status: doctorStatus,
        schedules: scheduleArray,
      });

      setSuccessMessage("Weekly consulting schedule saved successfully.");
    } catch (err) {
      console.error("Save schedule error:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to update doctor schedule."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Title & Practice Overview */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Clinical Availability & Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your active weekly consultation hours, slot duration, and leave status across the hospital network.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<FlashOn />}
          onClick={handleApplyMonFriPreset}
          sx={{ fontWeight: 700 }}
        >
          Apply Standard Mon–Fri Preset
        </Button>
      </Box>

      {/* Notifications */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* Doctor Status Card */}
      <Card sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <LocalHospital color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Clinical Consultation Status
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                When marked "On Clinical Leave", all appointment bookings for your profile are automatically suspended in the public directory.
              </Typography>
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 2 }}>
              <TextField
                select
                size="small"
                label="Current Status"
                value={doctorStatus}
                onChange={(e) => setDoctorStatus(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="active">Active & Available</MenuItem>
                <MenuItem value="on_leave">On Clinical Leave</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Weekly Schedule Matrix */}
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Weekly Consulting Days & Session Windows
          </Typography>

          <Stack spacing={2} divider={<Divider />}>
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const item = schedules[key] || {
                enabled: false,
                start_time: "08:00",
                end_time: "16:00",
                slot_duration_minutes: 30,
              };

              return (
                <Box
                  key={key}
                  sx={{
                    py: 1,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                    opacity: item.enabled ? 1 : 0.6,
                  }}
                >
                  {/* Day Toggle */}
                  <Box sx={{ minWidth: 180 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.enabled}
                          onChange={() => handleToggleDay(key)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {label}
                        </Typography>
                      }
                    />
                    <Chip
                      label={item.enabled ? "Consulting" : "Off Duty"}
                      size="small"
                      color={item.enabled ? "success" : "default"}
                      variant="outlined"
                      sx={{ ml: 2, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  </Box>

                  {/* Time Range & Duration Controls */}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ width: { xs: "100%", md: "auto" } }}
                  >
                    <TextField
                      label="Start Time"
                      type="time"
                      size="small"
                      disabled={!item.enabled}
                      value={item.start_time}
                      onChange={(e) => handleFieldChange(key, "start_time", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: { sm: 140 } }}
                    />

                    <TextField
                      label="End Time"
                      type="time"
                      size="small"
                      disabled={!item.enabled}
                      value={item.end_time}
                      onChange={(e) => handleFieldChange(key, "end_time", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: { sm: 140 } }}
                    />

                    <TextField
                      select
                      label="Slot Length"
                      size="small"
                      disabled={!item.enabled}
                      value={item.slot_duration_minutes}
                      onChange={(e) => handleFieldChange(key, "slot_duration_minutes", e.target.value)}
                      sx={{ width: { sm: 140 } }}
                    >
                      <MenuItem value={15}>15 Minutes</MenuItem>
                      <MenuItem value={20}>20 Minutes</MenuItem>
                      <MenuItem value={30}>30 Minutes</MenuItem>
                      <MenuItem value={45}>45 Minutes</MenuItem>
                      <MenuItem value={60}>60 Minutes</MenuItem>
                    </TextField>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              disabled={saving}
              onClick={handleSubmit}
              sx={{ px: 4, py: 1.5, fontWeight: 700 }}
            >
              Save Clinical Availability
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DoctorScheduleManager;
