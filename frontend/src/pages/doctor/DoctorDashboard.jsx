import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  LocalHospital,
  EventAvailable,
  CheckCircle,
  Schedule,
  Person,
  PlayArrow,
  Medication,
  Warning,
  ArrowForward,
  Speed,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import appointmentApi from "../../api/appointment";

const DoctorDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayQueue = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getAppointments();
        if (res.success && res.data) {
          setAppointments(res.data);
        }
      } catch (err) {
        console.error("Failed to load doctor appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayQueue();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr);
  const pendingOrConfirmed = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const completedToday = appointments.filter((a) => a.status === "completed");
  const emergencyAppointments = appointments.filter((a) => a.is_emergency);

  // Next patient in line
  const nextPatient = pendingOrConfirmed[0];

  return (
    <Box sx={{ py: 4, bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50", minHeight: "90vh" }}>
      <Container maxWidth="xl">
        {/* Welcome Banner */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Welcome, Dr. {user?.name || "Clinician"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clinical Workspace • Karongi Referral Hospital Network
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => navigate("/doctor/schedule")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              My Availability
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LocalHospital />}
              onClick={() => navigate("/doctor/appointments")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Appointments Queue
            </Button>
          </Box>
        </Box>

        {/* 4 KPI Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    PENDING QUEUE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {pendingOrConfirmed.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "warning.lighter", color: "warning.main", width: 48, height: 48 }}>
                  <Schedule />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    COMPLETED VISITS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                    {completedToday.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.lighter", color: "success.main", width: 48, height: 48 }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    EMERGENCY TRIAGE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "error.main" }}>
                    {emergencyAppointments.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "error.lighter", color: "error.main", width: 48, height: 48 }}>
                  <Warning />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    ALL SCHEDULED
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>
                    {appointments.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.lighter", color: "primary.main", width: 48, height: 48 }}>
                  <EventAvailable />
                </Avatar>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Next Patient in Line Callout */}
        {nextPatient && (
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: 3,
              p: 2.5,
              mb: 4,
              bgcolor: theme.palette.mode === "dark" ? "rgba(25, 118, 210, 0.08)" : "primary.lighter",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 50, height: 50, bgcolor: "primary.main", fontWeight: 700 }}>
                  {nextPatient.patient?.name?.charAt(0) || "P"}
                </Avatar>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Next Patient: {nextPatient.patient?.name}
                    </Typography>
                    {nextPatient.is_emergency && (
                      <Chip label="EMERGENCY" color="error" size="small" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Slot: {nextPatient.start_time} - {nextPatient.end_time} • Ref: {nextPatient.booking_reference} • Reason: {nextPatient.reason || "General Consultation"}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => navigate(`/doctor/consultation/${nextPatient.id}`)}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3 }}
              >
                Start Consultation
              </Button>
            </Box>
          </Card>
        )}

        {/* Live Patient Queue List */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Active Clinical Queue
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => navigate("/doctor/appointments")}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Full Queue View
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : appointments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              No appointments scheduled for today.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {appointments.slice(0, 5).map((appt) => (
                <Box
                  key={appt.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: "background.paper",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40, fontWeight: 600 }}>
                      {appt.patient?.name?.charAt(0) || "P"}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {appt.patient?.name}
                        </Typography>
                        <Chip
                          label={appt.status.toUpperCase()}
                          size="small"
                          color={
                            appt.status === "completed"
                              ? "success"
                              : appt.status === "confirmed"
                              ? "primary"
                              : "default"
                          }
                          sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {appt.appointment_date} • {appt.start_time} - {appt.end_time} • {appt.reason || "General Visit"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    {appt.status !== "completed" && appt.status !== "cancelled" ? (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/doctor/consultation/${appt.id}`)}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                      >
                        Consult
                      </Button>
                    ) : (
                      <Chip label="Completed" size="small" variant="outlined" color="success" />
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default DoctorDashboard;
