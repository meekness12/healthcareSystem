import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import {
  EventAvailable,
  AccessTime,
  CheckCircle,
  Close,
  Phone,
  Badge,
  Warning,
  Person,
  MedicalServices,
  LocalHospital,
  EventBusy,
} from "@mui/icons-material";
import appointmentApi from "../../api/appointment";

const DoctorAppointments = () => {
  const theme = useTheme();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Today, 1: Upcoming, 2: Emergency, 3: All
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Dialog State for completing appointment
  const [actionAppt, setActionAppt] = useState(null);
  const [actionType, setActionType] = useState(""); // "complete", "cancel", "no_show"
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getAppointments();
      if (res?.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error("Failed to load doctor appointments:", err);
      setFeedback({ type: "error", message: "Failed to load clinical appointments." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const todayList = appointments.filter((a) => a.appointment_date === todayStr);
  const upcomingList = appointments.filter(
    (a) => a.appointment_date >= todayStr && ["pending", "confirmed"].includes(a.status)
  );
  const emergencyList = appointments.filter((a) => a.is_emergency);

  let displayedList = [];
  if (activeTab === 0) displayedList = todayList;
  else if (activeTab === 1) displayedList = upcomingList;
  else if (activeTab === 2) displayedList = emergencyList;
  else displayedList = appointments;

  const handleQuickStatusChange = async (apptId, newStatus, notes = "") => {
    try {
      await appointmentApi.updateStatus(apptId, { status: newStatus, notes });
      setFeedback({ type: "success", message: `Appointment status updated to ${newStatus.toUpperCase()}.` });
      fetchAppointments();
    } catch (err) {
      console.error("Status update error:", err);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to update status." });
    }
  };

  const handleActionSubmit = async () => {
    if (!actionAppt || !actionType) return;
    setSavingAction(true);
    try {
      await appointmentApi.updateStatus(actionAppt.id, {
        status: actionType,
        notes: clinicalNotes.trim(),
      });
      setFeedback({
        type: "success",
        message: `Appointment ${actionAppt.booking_reference} marked as ${actionType.toUpperCase()}.`,
      });
      setActionAppt(null);
      setActionType("");
      setClinicalNotes("");
      fetchAppointments();
    } catch (err) {
      console.error("Action error:", err);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to execute action." });
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Clinical Appointments Console
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Outpatient consultation queue, daily patient triage, status tracking, and clinical consultations.
        </Typography>
      </Box>

      {feedback.message && (
        <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback({ type: "", message: "" })}>
          {feedback.message}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2 }}
        >
          <Tab label={`Today's Queue (${todayList.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Upcoming (${upcomingList.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Emergency Fast-Track (${emergencyList.length})`} sx={{ fontWeight: 700, color: "error.main" }} />
          <Tab label={`All Consultations (${appointments.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : displayedList.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
          <EventAvailable sx={{ fontSize: 56, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No consultations found in this queue.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {displayedList.map((appt) => (
            <Grid item xs={12} md={6} lg={4} key={appt.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  border: appt.is_emergency
                    ? "2px solid #ef4444"
                    : `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  {/* Top Header */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                      {appt.booking_reference}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {appt.is_emergency && (
                        <Chip
                          label="EMERGENCY"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 800, animation: "pulse 1.5s infinite" }}
                        />
                      )}
                      <Chip
                        label={appt.status?.toUpperCase()}
                        color={
                          appt.status === "confirmed"
                            ? "success"
                            : appt.status === "pending"
                            ? "warning"
                            : appt.status === "completed"
                            ? "info"
                            : "default"
                        }
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                      />
                    </Box>
                  </Box>

                  {/* Patient Info */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main", fontWeight: 700 }}>
                      {appt.patient?.name?.charAt(0) || "P"}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {appt.patient?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        ID: {appt.patient?.patient_number} • Phone: {appt.patient?.phone}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Allergies Alert if any */}
                  {appt.patient?.allergies && (
                    <Chip
                      label={`Allergies: ${appt.patient.allergies}`}
                      color="warning"
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2, fontWeight: 700, fontSize: "0.75rem" }}
                    />
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Session Schedule */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <AccessTime fontSize="small" color="primary" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {appt.appointment_date} | {appt.start_time} - {appt.end_time}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block">
                    CHIEF COMPLAINT:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                    {appt.reason}
                  </Typography>

                  {appt.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontStyle: "italic" }}>
                      Notes: {appt.notes}
                    </Typography>
                  )}
                </CardContent>

                {/* Doctor Action Controls */}
                <CardActions sx={{ p: 2, pt: 0, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                  {appt.status === "pending" && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleQuickStatusChange(appt.id, "confirmed", "Confirmed by attending doctor")}
                    >
                      Confirm
                    </Button>
                  )}

                  {appt.status === "confirmed" && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setActionAppt(appt);
                        setActionType("completed");
                        setClinicalNotes("");
                      }}
                    >
                      Mark Completed
                    </Button>
                  )}

                  {["pending", "confirmed"].includes(appt.status) && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => {
                          setActionAppt(appt);
                          setActionType("no_show");
                          setClinicalNotes("");
                        }}
                      >
                        No-Show
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setActionAppt(appt);
                          setActionType("cancelled");
                          setClinicalNotes("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Dialog (Complete, Cancel, No-Show) */}
      <Dialog
        open={Boolean(actionAppt)}
        onClose={() => setActionAppt(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {actionType === "completed" && "Complete Consultation"}
          {actionType === "cancelled" && "Cancel Consultation"}
          {actionType === "no_show" && "Mark Patient as No-Show"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Appointment: <strong>{actionAppt?.booking_reference}</strong> ({actionAppt?.patient?.name})
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={actionType === "completed" ? "Clinical Summary Notes" : "Reason / Explanatory Notes"}
            placeholder={
              actionType === "completed"
                ? "Diagnosis, patient recommendations, follow-up instructions..."
                : "Enter explanation..."
            }
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionAppt(null)} color="inherit">
            Dismiss
          </Button>
          <Button
            variant="contained"
            color={actionType === "completed" ? "primary" : actionType === "cancelled" ? "error" : "warning"}
            disabled={savingAction}
            onClick={handleActionSubmit}
            sx={{ fontWeight: 700 }}
          >
            {savingAction ? <CircularProgress size={20} color="inherit" /> : "Save Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DoctorAppointments;
