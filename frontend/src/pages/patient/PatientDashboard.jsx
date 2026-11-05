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
  useTheme,
} from "@mui/material";
import {
  CalendarMonth,
  Medication,
  HistoryEdu,
  Security,
  Add,
  ArrowForward,
  Warning,
  LocalHospital,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import appointmentApi from "../../api/appointment";
import prescriptionApi from "../../api/prescription";
import consultationApi from "../../api/consultation";

const PatientDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [apptRes, rxRes, consultRes] = await Promise.allSettled([
          appointmentApi.getAppointments(),
          prescriptionApi.getPrescriptions(),
          consultationApi.getConsultations(),
        ]);

        if (apptRes.status === "fulfilled" && apptRes.value.success) {
          setAppointments(apptRes.value.data || []);
        }
        if (rxRes.status === "fulfilled" && rxRes.value.success) {
          setPrescriptions(rxRes.value.data || []);
        }
        if (consultRes.status === "fulfilled" && consultRes.value.success) {
          setConsultations(consultRes.value.data || []);
        }
      } catch (err) {
        console.error("Error loading patient dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const upcomingAppointments = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));

  return (
    <Box sx={{ py: 4, bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50", minHeight: "90vh" }}>
      <Container maxWidth="xl">
        {/* Welcome Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Welcome back, {user?.name || "Patient"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient Portal • Rwanda National Hospital Network
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Warning />}
              onClick={() => navigate("/emergency/triage")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Emergency Triage
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => navigate("/patient/book-appointment")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Book Appointment
            </Button>
          </Box>
        </Box>

        {/* 4 Stats Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    UPCOMING VISITS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "primary.main" }}>
                    {upcomingAppointments.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.lighter", color: "primary.main", width: 48, height: 48 }}>
                  <CalendarMonth />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    ACTIVE PRESCRIPTIONS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "info.main" }}>
                    {prescriptions.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.lighter", color: "info.main", width: 48, height: 48 }}>
                  <Medication />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    CLINICAL VISITS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                    {consultations.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.lighter", color: "success.main", width: 48, height: 48 }}>
                  <HistoryEdu />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    INSURANCE STATUS
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.8, color: "success.main" }}>
                    Active (RSSB/RAMA)
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.lighter", color: "success.main", width: 48, height: 48 }}>
                  <Security />
                </Avatar>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Upcoming Doctor Visits
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate("/patient/appointments")}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    View All
                  </Button>
                </Box>

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : upcomingAppointments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No upcoming appointments scheduled.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {upcomingAppointments.slice(0, 3).map((appt) => (
                      <Box
                        key={appt.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Dr. {appt.doctor?.name} ({appt.doctor?.specialty})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appt.appointment_date} • {appt.start_time} • {appt.branch?.branch_name}
                          </Typography>
                        </Box>
                        <Chip
                          label={appt.status.toUpperCase()}
                          size="small"
                          color={appt.status === "confirmed" ? "primary" : "default"}
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => navigate("/patient/book-appointment")}
                sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Schedule New Appointment
              </Button>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    My Health Records & Prescriptions
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate("/patient/records")}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Open Records
                  </Button>
                </Box>

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : consultations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No recorded consultations yet.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {consultations.slice(0, 3).map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {c.diagnosis}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.created_at?.slice(0, 10)} • Dr. {c.doctor?.name}
                          </Typography>
                        </Box>
                        <Chip
                          label="Completed"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => navigate("/patient/records")}
                sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Access Full Health Records (EHR)
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PatientDashboard;
