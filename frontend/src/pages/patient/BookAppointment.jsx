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
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import {
  EventAvailable,
  LocalHospital,
  LocationOn,
  Security,
  MedicalServices,
  AccessTime,
  CheckCircle,
  QrCode2,
  Print,
  ArrowForward,
  AssignmentTurnedIn,
  HealthAndSafety,
  Phone,
} from "@mui/icons-material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import doctorApi from "../../api/doctor";
import appointmentApi from "../../api/appointment";
import TimeSlotPicker from "../../components/booking/TimeSlotPicker";

const BookAppointment = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Pre-selected parameters from URL if any
  const preSelectedDoctorId = searchParams.get("doctor_id") || "";
  const preSelectedDate = searchParams.get("date") || "";
  const preSelectedStartTime = searchParams.get("start_time") || "";

  const [selectedDoctorId, setSelectedDoctorId] = useState(preSelectedDoctorId);
  const [selectedSlot, setSelectedSlot] = useState(
    preSelectedDate && preSelectedStartTime
      ? { date: preSelectedDate, start_time: preSelectedStartTime }
      : null
  );

  const [formData, setFormData] = useState({
    appointment_type: "general",
    reason: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch doctors list
  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      try {
        const res = await doctorApi.getDoctors();
        if (isMounted && res?.data) {
          setDoctors(res.data);
          if (preSelectedDoctorId && !selectedDoctorId) {
            setSelectedDoctorId(preSelectedDoctorId);
          }
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    };
    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, [preSelectedDoctorId]);

  const selectedDoctor = doctors.find((d) => String(d.id) === String(selectedDoctorId));

  // Insurance Co-Pay Computation
  const baseFee = selectedDoctor ? Number(selectedDoctor.consultation_fee) : 0;
  const patientInsurance = user?.patient?.insurance_provider_name || null;
  // Estimate coverage percentage based on known schemes
  let coveragePercent = 0;
  if (patientInsurance) {
    if (patientInsurance.includes("90%")) coveragePercent = 90;
    else if (patientInsurance.includes("85%")) coveragePercent = 85;
    else if (patientInsurance.includes("80%")) coveragePercent = 80;
    else coveragePercent = 85; // Default Rwandan social insurance
  }
  const insuranceCovered = roundMoney(baseFee * (coveragePercent / 100));
  const estimatedCopay = Math.max(0, baseFee - insuranceCovered);

  function roundMoney(val) {
    return Math.round(val);
  }

  const handleSlotSelect = (slotData) => {
    setSelectedSlot(slotData);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedDoctorId) {
      setErrorMessage("Please select a medical specialist.");
      return;
    }

    if (!selectedSlot || !selectedSlot.date || !selectedSlot.start_time) {
      setErrorMessage("Please select an available consultation date and time slot.");
      return;
    }

    if (!formData.reason.trim()) {
      setErrorMessage("Please provide the primary reason or symptoms for your consultation.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        doctor_id: Number(selectedDoctorId),
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        appointment_type: formData.appointment_type,
        reason: formData.reason.trim(),
        notes: formData.notes.trim() || null,
      };

      const res = await appointmentApi.bookAppointment(payload);
      setBookingSuccess(res.data);
    } catch (err) {
      console.error("Booking error:", err);
      const msg =
        err.response?.data?.errors?.start_time?.[0] ||
        err.response?.data?.errors?.appointment_date?.[0] ||
        err.response?.data?.message ||
        "Booking failed. Please try another time slot.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Book a Clinical Consultation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule outpatient appointments with specialists across the Rwanda Hospital Network with instant insurance verification.
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Doctor Selection & Schedule Picker */}
        <Grid item xs={12} md={7}>
          {/* Step 1: Doctor Selection */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <MedicalServices color="primary" fontSize="small" /> 1. Select Medical Specialist
              </Typography>

              {loadingDoctors ? (
                <CircularProgress size={24} />
              ) : (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Accredited Specialist Doctor"
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setSelectedSlot(null);
                  }}
                  helperText="Choose doctor from any provincial branch"
                >
                  <MenuItem value="">
                    <em>Select a Doctor</em>
                  </MenuItem>
                  {doctors.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name} — {d.specialty_name} ({d.branch_name}) • {Number(d.consultation_fee).toLocaleString()} RWF
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {/* Selected Doctor Summary Preview */}
              {selectedDoctor && (
                <Box
                  sx={{
                    mt: 2.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(13, 148, 136, 0.05)",
                    border: `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    src={selectedDoctor.avatar_url || undefined}
                    sx={{ width: 48, height: 48, bgcolor: "primary.main", fontWeight: 700 }}
                  >
                    {selectedDoctor.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {selectedDoctor.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {selectedDoctor.specialty_name} • {selectedDoctor.department_name}
                    </Typography>
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                      <LocationOn fontSize="inherit" /> {selectedDoctor.branch_name} ({selectedDoctor.consultation_room})
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" display="block">
                      BASE TARIFF
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                      {Number(selectedDoctor.consultation_fee).toLocaleString()} RWF
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Date & Available Slots Picker */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTime color="primary" fontSize="small" /> 2. Pick Consultation Date & Session Slot
              </Typography>

              {selectedDoctorId ? (
                <TimeSlotPicker
                  doctorId={selectedDoctorId}
                  doctorName={selectedDoctor?.name}
                  consultationFee={selectedDoctor?.consultation_fee}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSlotSelect}
                />
              ) : (
                <Alert severity="info">
                  Please select a medical specialist above to view their live available consulting hours.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Intake Details, Insurance Co-Pay, and Submit */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, position: "sticky", top: 80 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentTurnedIn color="primary" fontSize="small" /> 3. Consultation Intake
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                {/* Appointment Type */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Consultation Nature"
                  value={formData.appointment_type}
                  onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="general">General Outpatient Consultation</MenuItem>
                  <MenuItem value="specialist">Specialist / Clinical Diagnostic</MenuItem>
                  <MenuItem value="follow_up">Routine Medical Follow-up</MenuItem>
                  <MenuItem value="emergency">Emergency / Acute Triage</MenuItem>
                </TextField>

                {/* Reason for Visit */}
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={3}
                  label="Primary Reason / Chief Complaint"
                  placeholder="Describe your symptoms, medical concern, or doctor referral reason..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  sx={{ mb: 2 }}
                />

                {/* Optional Clinical Notes */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Additional Notes / Past Medications (Optional)"
                  placeholder="e.g. Current medications, recent lab reports, specific questions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  sx={{ mb: 3 }}
                />

                {/* Rwandan Health Insurance Co-Pay Calculator Card */}
                <Box
                  sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(20, 184, 166, 0.1)"
                        : "rgba(13, 148, 136, 0.06)",
                    border: `1px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <HealthAndSafety color="primary" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                      Rwandan Insurance Co-Pay Summary
                    </Typography>
                  </Box>

                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">
                        Doctor Consultation Fee:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {baseFee.toLocaleString()} RWF
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">
                        Insurance Scheme:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: patientInsurance ? "success.main" : "text.secondary" }}>
                        {patientInsurance || "Self-Pay (Uninsured)"}
                      </Typography>
                    </Box>

                    {patientInsurance && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                          Insurance Contribution ({coveragePercent}%):
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>
                          - {insuranceCovered.toLocaleString()} RWF
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 0.5 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Estimated Patient Co-Pay:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                        {estimatedCopay.toLocaleString()} RWF
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Selected Slot Recap */}
                {selectedSlot && (
                  <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                    Session: <strong>{selectedSlot.date}</strong> at <strong>{selectedSlot.start_time}</strong>
                  </Alert>
                )}

                {/* Submit Action */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={submitting || !selectedDoctorId || !selectedSlot}
                  sx={{ py: 1.5, fontWeight: 700, fontSize: "1rem" }}
                >
                  {submitting ? (
                    <CircularProgress size={24} sx={{ color: "primary.contrastText" }} />
                  ) : (
                    "Confirm & Issue Booking Voucher"
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Booking Voucher Dialog */}
      <Dialog
        open={Boolean(bookingSuccess)}
        onClose={() => {
          setBookingSuccess(null);
          navigate("/patient/appointments");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <CheckCircle sx={{ fontSize: 52, color: "success.main", mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Appointment Confirmed!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your clinical consultation voucher has been generated and registered in the hospital database.
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {bookingSuccess && (
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: `2px dashed ${theme.palette.primary.main}`,
                bgcolor: theme.palette.mode === "dark" ? "background.default" : "#fdfefe",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    BOOKING VOUCHER REFERENCE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "primary.main", letterSpacing: "0.05em" }}>
                    {bookingSuccess.booking_reference}
                  </Typography>
                </Box>
                <QrCode2 sx={{ fontSize: 60, color: "text.secondary" }} />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    PATIENT NAME
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {bookingSuccess.patient?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bookingSuccess.patient?.patient_number}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ATTENDING DOCTOR
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {bookingSuccess.doctor?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bookingSuccess.doctor?.specialty_name}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    DATE & TIME
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {bookingSuccess.appointment_date}
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                    {bookingSuccess.start_time} - {bookingSuccess.end_time}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    HOSPITAL LOCATION
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {bookingSuccess.branch?.branch_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bookingSuccess.doctor?.consultation_room}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  OUT-OF-POCKET CO-PAY:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "primary.main" }}>
                  {Number(bookingSuccess.financial?.patient_copay_amount || 0).toLocaleString()} RWF
                </Typography>
              </Box>
            </Box>
          )}

          <Alert severity="info" icon={<Phone />} sx={{ mt: 2 }}>
            A confirmation reminder has been queued to your Rwandan phone ({user?.phone}).
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Button
            startIcon={<Print />}
            color="inherit"
            onClick={() => window.print()}
          >
            Print Voucher
          </Button>

          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => {
              setBookingSuccess(null);
              navigate("/patient/appointments");
            }}
            sx={{ fontWeight: 700 }}
          >
            Go to My Appointments
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookAppointment;
