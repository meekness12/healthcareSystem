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
  CalendarMonth,
  Medication,
  HistoryEdu,
  Security,
  Add,
  ArrowForward,
  Warning,
  LocalHospital,
  LocationOn,
  AccessTime,
  CheckCircle,
  HourglassEmpty,
  Refresh,
  ShieldOutlined,
  VerifiedUser,
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const upcomingAppointments = appointments.filter((a) =>
    ["pending", "confirmed"].includes(a.status)
  );

  // Helper: Format doctor name cleanly to avoid "Dr. Dr." repetition
  const formatDoctorName = (name) => {
    if (!name) return "Assigned Specialist";
    const cleaned = name.replace(/^Dr\.?\s*/i, "").trim();
    return `Dr. ${cleaned}`;
  };

  // Format today's date in Rwandan clinical standard format
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <Box
      sx={{
        py: { xs: 2.5, md: 3.5 },
        px: { xs: 1, sm: 2, md: 3 },
        bgcolor: "background.default",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Container maxWidth="xl" disableGutters>
        {/* 1. Header & Welcome Area */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            mb: 3,
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "text.primary",
                }}
              >
                Welcome back, {user?.name?.split(" ")[0] || "Patient"}
              </Typography>
              <Chip
                icon={<VerifiedUser sx={{ fontSize: "14px !important" }} />}
                label={user?.patient_number || "PATIENT"}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: "0.68rem",
                  fontWeight: 750,
                  fontFamily: "monospace",
                }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>{todayFormatted}</span>
              <span>•</span>
              <span>RP Karongi Teaching & Referral Hospital</span>
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={fetchDashboardData}
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 1.5,
                py: 0.7,
                borderColor: theme.palette.divider,
                color: "text.secondary",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </Button>

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Warning sx={{ fontSize: 17 }} />}
              onClick={() => navigate("/emergency/triage")}
              sx={{
                borderRadius: 2,
                px: 1.8,
                py: 0.7,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                borderColor: "rgba(220, 38, 38, 0.35)",
              }}
            >
              Emergency Triage
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Add sx={{ fontSize: 18 }} />}
              onClick={() => navigate("/patient/book-appointment")}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.75,
                fontWeight: 700,
                fontSize: "0.84rem",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
              }}
            >
              Book Appointment
            </Button>
          </Stack>
        </Box>

        {/* 2. S-Tier Metric Telemetry Cards */}
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          {/* Card 1: Upcoming Appointments */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.25,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                bgcolor: "background.paper",
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 750,
                    letterSpacing: "0.06em",
                    color: "text.secondary",
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                  }}
                >
                  Upcoming Visits
                </Typography>
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.12)" : "rgba(5, 150, 105, 0.08)",
                    color: "primary.main",
                    display: "flex",
                  }}
                >
                  <CalendarMonth sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: "text.primary",
                  }}
                >
                  {upcomingAppointments.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    color: upcomingAppointments.length > 0 ? "primary.main" : "text.secondary",
                    fontWeight: 650,
                    fontSize: "0.72rem",
                  }}
                >
                  <span>●</span>
                  {upcomingAppointments.length > 0
                    ? `Next visit scheduled`
                    : `No upcoming visits`}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 2: Active Prescriptions */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.25,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                bgcolor: "background.paper",
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 750,
                    letterSpacing: "0.06em",
                    color: "text.secondary",
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                  }}
                >
                  Active Prescriptions
                </Typography>
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.08)",
                    color: "secondary.main",
                    display: "flex",
                  }}
                >
                  <Medication sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: "text.primary",
                  }}
                >
                  {prescriptions.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    color: prescriptions.length > 0 ? "secondary.main" : "text.secondary",
                    fontWeight: 650,
                    fontSize: "0.72rem",
                  }}
                >
                  <span>●</span>
                  {prescriptions.length > 0 ? "Hospital pharmacy verified" : "No active medication"}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 3: Clinical Encounters */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.25,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                bgcolor: "background.paper",
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 750,
                    letterSpacing: "0.06em",
                    color: "text.secondary",
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                  }}
                >
                  EHR Encounters
                </Typography>
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(168, 85, 247, 0.12)" : "rgba(147, 51, 234, 0.08)",
                    color: "#a855f7",
                    display: "flex",
                  }}
                >
                  <HistoryEdu sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: "text.primary",
                  }}
                >
                  {consultations.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    color: "text.secondary",
                    fontWeight: 650,
                    fontSize: "0.72rem",
                  }}
                >
                  <span>●</span>
                  Digital records synced
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 4: Health Insurance Status */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2.25,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                bgcolor: "background.paper",
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 750,
                    letterSpacing: "0.06em",
                    color: "text.secondary",
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                  }}
                >
                  Insurance Status
                </Typography>
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.12)" : "rgba(5, 150, 105, 0.08)",
                    color: "success.main",
                    display: "flex",
                  }}
                >
                  <Security sx={{ fontSize: 18 }} />
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    color: "success.main",
                  }}
                >
                  Active (RSSB/RAMA)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    color: "text.secondary",
                    fontWeight: 650,
                    fontSize: "0.72rem",
                  }}
                >
                  <span>●</span>
                  85% Co-pay covered
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* 3. Main Split View: Upcoming Appointments & Recent Health Records */}
        <Grid container spacing={2.5}>
          {/* Left Column: Upcoming Doctor Visits */}
          <Grid item xs={12} lg={6}>
            <Card
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.75 },
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.25,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
                    Upcoming Doctor Visits
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your scheduled clinic appointments across network facilities
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => navigate("/patient/appointments")}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    textTransform: "none",
                  }}
                >
                  View All
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 5 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : upcomingAppointments.length === 0 ? (
                <Box
                  sx={{
                    py: 5,
                    px: 3,
                    textAlign: "center",
                    borderRadius: 2,
                    border: `1px dashed ${theme.palette.divider}`,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
                  }}
                >
                  <CalendarMonth sx={{ fontSize: 36, color: "text.secondary", mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    No upcoming appointments
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    Need to consult a specialist or doctor? Book a clinical slot online.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => navigate("/patient/book-appointment")}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Schedule New Appointment
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  {upcomingAppointments.slice(0, 3).map((appt) => {
                    const isConfirmed = appt.status === "confirmed";
                    const formattedDocName = formatDoctorName(appt.doctor?.name);
                    const specialtyText = appt.doctor?.specialty ? `• ${appt.doctor.specialty}` : "";

                    return (
                      <Box
                        key={appt.id}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(15,23,42,0.01)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          transition: "all 0.15s ease-in-out",
                          "&:hover": {
                            borderColor: "primary.main",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: isConfirmed ? "primary.main" : "warning.main",
                              color: "#ffffff",
                              fontSize: "1rem",
                              fontWeight: 700,
                            }}
                          >
                            {formattedDocName.replace(/^Dr\.\s*/, "").charAt(0)}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 750, lineHeight: 1.2 }} noWrap>
                              {formattedDocName} {specialtyText && (
                                <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.8rem" }}>
                                  {specialtyText}
                                </Box>
                              )}
                            </Typography>

                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: 13, color: "text.secondary" }} />
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                  {appt.appointment_date} • {appt.start_time?.slice(0, 5) || "08:00"}
                                </Typography>
                              </Box>

                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                <LocationOn sx={{ fontSize: 13, color: "text.secondary" }} />
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                  {appt.branch?.branch_name || "RP Karongi Main Hospital"}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        </Stack>

                        <Chip
                          label={appt.status.toUpperCase()}
                          size="small"
                          color={isConfirmed ? "success" : "warning"}
                          variant={isConfirmed ? "filled" : "outlined"}
                          sx={{
                            fontWeight: 750,
                            fontSize: "0.68rem",
                            height: 22,
                            letterSpacing: "0.03em",
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Card>
          </Grid>

          {/* Right Column: Health Records & Prescriptions */}
          <Grid item xs={12} lg={6}>
            <Card
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.75 },
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.25,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
                    Recent Medical Consultations (EHR)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Diagnoses, vital signs, and prescription history from clinical staff
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="text"
                  color="secondary"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => navigate("/patient/records")}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    textTransform: "none",
                  }}
                >
                  View EHR
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 5 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : consultations.length === 0 ? (
                <Box
                  sx={{
                    py: 5,
                    px: 3,
                    textAlign: "center",
                    borderRadius: 2,
                    border: `1px dashed ${theme.palette.divider}`,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
                  }}
                >
                  <HistoryEdu sx={{ fontSize: 36, color: "text.secondary", mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    No recorded consultations yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Clinical notes and prescriptions will appear here once finalized by your doctor.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  {consultations.slice(0, 3).map((consult) => {
                    const docName = formatDoctorName(consult.doctor?.name);
                    return (
                      <Box
                        key={consult.id}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.02)"
                              : "rgba(15,23,42,0.01)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          transition: "all 0.15s ease-in-out",
                          "&:hover": {
                            borderColor: "secondary.main",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 750, lineHeight: 1.2 }} noWrap>
                            {consult.diagnosis || "General Clinical Consultation"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>
                            {consult.created_at?.slice(0, 10)} • {docName}
                          </Typography>
                          {consult.notes && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{
                                display: "block",
                                mt: 0.25,
                                fontStyle: "italic",
                                opacity: 0.85,
                              }}
                            >
                              "{consult.notes}"
                            </Typography>
                          )}
                        </Box>

                        <Chip
                          label="COMPLETED"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{
                            fontWeight: 750,
                            fontSize: "0.65rem",
                            height: 20,
                            letterSpacing: "0.03em",
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* 4. Ministerial Health Network Compliance & Accreditation Bar */}
        <Box
          sx={{
            mt: 3.5,
            p: 2.5,
            borderRadius: 3,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(16, 185, 129, 0.05)"
                : "rgba(5, 150, 105, 0.04)",
            border: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(5, 150, 105, 0.1)",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldOutlined sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
                Republic of Rwanda • Ministry of Health Compliant Digital Records
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Protected under Rwanda Law No. 058/2021 on Personal Data Protection & Privacy.
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="RSSB / RAMA Verified"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
            <Chip
              label="CBHI Mutuelle Compatible"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default PatientDashboard;
