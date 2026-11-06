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
  LocationOn,
  LocalHospital,
  Close,
  EditCalendar,
  Cancel,
  QrCode2,
  Print,
  CheckCircle,
  WarningAmber,
  MedicalServices,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import appointmentApi from "../../api/appointment";
import TimeSlotPicker from "../../components/booking/TimeSlotPicker";

const MyAppointments = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Upcoming, 1: Completed, 2: Cancelled, 3: All

  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Dialog States
  const [voucherAppt, setVoucherAppt] = useState(null);
  const [cancelDialogAppt, setCancelDialogAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getAppointments();
      if (res?.data) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setFeedback({ type: "error", message: "Unable to load appointments. Please refresh or try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments by tab
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingList = appointments.filter(
    (a) => ["pending", "confirmed"].includes(a.status) && a.appointment_date >= todayStr
  );
  const completedList = appointments.filter((a) => a.status === "completed");
  const cancelledList = appointments.filter((a) => a.status === "cancelled");

  let displayedAppointments = [];
  if (activeTab === 0) displayedAppointments = upcomingList;
  else if (activeTab === 1) displayedAppointments = completedList;
  else if (activeTab === 2) displayedAppointments = cancelledList;
  else displayedAppointments = appointments;

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!cancelDialogAppt) return;
    setCancelling(true);
    try {
      await appointmentApi.updateStatus(cancelDialogAppt.id, {
        status: "cancelled",
        cancellation_reason: cancelReason.trim() || "Patient requested cancellation",
      });
      setFeedback({ type: "success", message: "Appointment cancelled successfully. The consultation slot has been released." });
      setCancelDialogAppt(null);
      setCancelReason("");
      fetchAppointments();
    } catch (err) {
      console.error("Cancellation error:", err);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to cancel appointment." });
    } finally {
      setCancelling(false);
    }
  };

  // Handle Rescheduling
  const handleConfirmReschedule = async () => {
    if (!rescheduleAppt || !rescheduleSlot) return;
    setRescheduling(true);
    try {
      await appointmentApi.reschedule(rescheduleAppt.id, {
        appointment_date: rescheduleSlot.date,
        start_time: rescheduleSlot.start_time,
        reason: "Patient rescheduled consultation slot",
      });
      setFeedback({ type: "success", message: "Appointment successfully rescheduled to new session slot!" });
      setRescheduleAppt(null);
      setRescheduleSlot(null);
      fetchAppointments();
    } catch (err) {
      console.error("Reschedule error:", err);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to reschedule appointment." });
    } finally {
      setRescheduling(false);
    }
  };

  const getStatusChip = (status, isEmergency) => {
    if (isEmergency) {
      return <Chip label="EMERGENCY" color="error" size="small" sx={{ fontWeight: 800 }} />;
    }
    switch (status) {
      case "confirmed":
        return <Chip label="CONFIRMED" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case "pending":
        return <Chip label="PENDING CONFIRMATION" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case "completed":
        return <Chip label="COMPLETED" color="info" size="small" sx={{ fontWeight: 700 }} />;
      case "cancelled":
        return <Chip label="CANCELLED" color="default" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status?.toUpperCase()} size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title & Action */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            My Clinical Appointments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your outpatient appointments, view digital booking vouchers, reschedule slots, or track consultation history.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<EventAvailable />}
          onClick={() => navigate("/patient/book-appointment")}
          sx={{ fontWeight: 700 }}
        >
          Book New Consultation
        </Button>
      </Box>

      {feedback.message && (
        <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback({ type: "", message: "" })}>
          {feedback.message}
        </Alert>
      )}

      {/* Status Tabs */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2 }}
        >
          <Tab label={`Upcoming (${upcomingList.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Completed (${completedList.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Cancelled (${cancelledList.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`All (${appointments.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Card>

      {/* Appointment Cards List */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : displayedAppointments.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
          <LocalHospital sx={{ fontSize: 56, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No appointments found in this view.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/patient/book-appointment")}
            sx={{ mt: 2, fontWeight: 700 }}
          >
            Schedule an Appointment
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {displayedAppointments.map((appt) => (
            <Grid item xs={12} md={6} lg={4} key={appt.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 24px rgba(0,0,0,0.5)"
                        : "0 8px 24px rgba(13, 148, 136, 0.1)",
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  {/* Top Status & Reference */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                      {appt.booking_reference}
                    </Typography>
                    {getStatusChip(appt.status, appt.is_emergency)}
                  </Box>

                  {/* Doctor Info */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
                    <Avatar
                      src={appt.doctor?.avatar_url || undefined}
                      sx={{ width: 50, height: 50, bgcolor: "primary.main", fontWeight: 700 }}
                    >
                      {appt.doctor?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {appt.doctor?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appt.doctor?.specialty_name} • Lic: {appt.doctor?.license_number}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Date, Time & Branch */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTime fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {appt.appointment_date} | {appt.start_time} - {appt.end_time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {appt.branch?.branch_name} ({appt.doctor?.consultation_room})
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Reason */}
                  <Typography variant="caption" color="text.secondary" display="block">
                    REASON FOR VISIT:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }} noWrap>
                    {appt.reason}
                  </Typography>

                  {/* Co-Pay Pill */}
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 1.5,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(13, 148, 136, 0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {appt.financial?.has_insurance ? appt.financial.provider_name : "Self-Pay"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main" }}>
                      Co-Pay: {Number(appt.financial?.patient_copay_amount || 0).toLocaleString()} RWF
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<QrCode2 />}
                    onClick={() => setVoucherAppt(appt)}
                  >
                    Voucher
                  </Button>

                  {["pending", "confirmed"].includes(appt.status) && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        color="secondary"
                        startIcon={<EditCalendar />}
                        onClick={() => {
                          setRescheduleAppt(appt);
                          setRescheduleSlot(null);
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => {
                          setCancelDialogAppt(appt);
                          setCancelReason("");
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

      {/* Voucher Dialog */}
      <Dialog
        open={Boolean(voucherAppt)}
        onClose={() => setVoucherAppt(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Booking Pass Voucher
          </Typography>
          <IconButton onClick={() => setVoucherAppt(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {voucherAppt && (
            <Box sx={{ p: 2, border: `2px dashed ${theme.palette.primary.main}`, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    REFERENCE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "primary.main" }}>
                    {voucherAppt.booking_reference}
                  </Typography>
                </Box>
                <QrCode2 sx={{ fontSize: 64, color: "text.secondary" }} />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">PATIENT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{voucherAppt.patient?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">DOCTOR</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{voucherAppt.doctor?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">SCHEDULED DATE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{voucherAppt.appointment_date}</Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                    {voucherAppt.start_time} - {voucherAppt.end_time}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">LOCATION</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{voucherAppt.branch?.branch_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{voucherAppt.doctor?.consultation_room}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">PATIENT OUT-OF-POCKET CO-PAY</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "primary.main" }}>
                  {Number(voucherAppt.financial?.patient_copay_amount || 0).toLocaleString()} RWF
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button startIcon={<Print />} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="contained" onClick={() => setVoucherAppt(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancellation Confirmation Dialog */}
      <Dialog
        open={Boolean(cancelDialogAppt)}
        onClose={() => setCancelDialogAppt(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
          <WarningAmber color="error" /> Cancel Appointment
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to cancel appointment <strong>{cancelDialogAppt?.booking_reference}</strong> with{" "}
            <strong>{cancelDialogAppt?.doctor?.name}</strong>?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Cancellation Reason (Optional)"
            placeholder="e.g. Schedule conflict, feeling better..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialogAppt(null)} color="inherit">
            Keep Appointment
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={cancelling}
            onClick={handleConfirmCancel}
            sx={{ fontWeight: 700 }}
          >
            {cancelling ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={Boolean(rescheduleAppt)}
        onClose={() => setRescheduleAppt(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Reschedule Appointment
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ref: {rescheduleAppt?.booking_reference} with {rescheduleAppt?.doctor?.name}
            </Typography>
          </Box>
          <IconButton onClick={() => setRescheduleAppt(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {rescheduleAppt && (
            <TimeSlotPicker
              doctorId={rescheduleAppt.doctor?.id}
              doctorName={rescheduleAppt.doctor?.name}
              selectedSlot={rescheduleSlot}
              onSelectSlot={(slot) => setRescheduleSlot(slot)}
            />
          )}

          {rescheduleSlot && (
            <Alert severity="info" sx={{ mt: 2 }}>
              New proposed slot: <strong>{rescheduleSlot.date}</strong> at <strong>{rescheduleSlot.start_time}</strong>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRescheduleAppt(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!rescheduleSlot || rescheduling}
            onClick={handleConfirmReschedule}
            sx={{ fontWeight: 700 }}
          >
            {rescheduling ? <CircularProgress size={20} color="inherit" /> : "Confirm Reschedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyAppointments;
