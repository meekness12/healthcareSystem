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
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import {
  LocalHospital,
  Person,
  Warning,
  History,
  CheckCircle,
  Print,
  ArrowBack,
  ExpandMore,
  Medication,
  CalendarMonth,
  AccessTime,
  EventAvailable,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import appointmentApi from "../../api/appointment";
import consultationApi from "../../api/consultation";
import VitalsEntryCard from "../../components/consultation/VitalsEntryCard";
import PrescriptionBuilder from "../../components/consultation/PrescriptionBuilder";

const COMMON_DIAGNOSES = [
  "Malaria (Uncomplicated)",
  "Essential Hypertension Stage 1",
  "Upper Respiratory Tract Infection (URTI)",
  "Acute Bronchitis",
  "Acute Gastroenteritis / Diarrheal Disease",
  "Type 2 Diabetes Mellitus",
  "Peptic Ulcer Disease / Gastritis",
  "Urinary Tract Infection (UTI)",
];

const DoctorConsultationRoom = () => {
  const theme = useTheme();
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [error, setError] = useState("");

  // Encounter Form State
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [vitals, setVitals] = useState({
    heart_rate: null,
    blood_pressure_systolic: null,
    blood_pressure_diastolic: null,
    temperature: null,
    spo2: null,
    weight_kg: null,
  });

  // Prescription Form State
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [generalInstructions, setGeneralInstructions] = useState("");

  // Completed Success Dialog State
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [createdConsultation, setCreatedConsultation] = useState(null);

  useEffect(() => {
    const fetchAppointmentAndHistory = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getAppointment(appointmentId);
        if (res.success && res.data) {
          const appt = res.data;
          setAppointment(appt);
          setSymptoms(appt.reason || "");

          // If consultation already exists for this appointment
          if (appt.consultation) {
            navigate(`/doctor/appointments`);
            return;
          }

          // Fetch patient past EHR history
          if (appt.patient?.id) {
            try {
              const histRes = await consultationApi.getPatientHistory(appt.patient.id);
              if (histRes.success && histRes.data) {
                setPatientHistory(histRes.data);
              }
            } catch (err) {
              console.warn("Could not load past history:", err);
            }
          }
        } else {
          setError("Appointment record not found.");
        }
      } catch (err) {
        console.error("Error loading appointment details:", err);
        setError("Failed to load clinical encounter data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentAndHistory();
  }, [appointmentId, navigate]);

  const handleSubmitEncounter = async () => {
    if (!symptoms.trim()) {
      setError("Please describe the patient's presenting symptoms / chief complaint.");
      return;
    }
    if (!diagnosis.trim()) {
      setError("Please record a primary clinical diagnosis.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        appointment_id: Number(appointmentId),
        symptoms,
        diagnosis,
        consultation_notes: consultationNotes,
        treatment_plan: treatmentPlan,
        follow_up_date: followUpDate || null,
        vitals,
      };

      // If prescription items are provided
      if (prescriptionItems.length > 0) {
        payload.prescription = {
          instructions: generalInstructions || null,
          items: prescriptionItems.map((item) => ({
            medicine_id: Number(item.medicine_id),
            dosage: item.dosage,
            frequency: item.frequency,
            duration_days: Number(item.duration_days),
            quantity_prescribed: Number(item.quantity_prescribed),
            instructions: item.instructions || null,
          })),
        };
      }

      const res = await consultationApi.recordConsultation(payload);
      if (res.success && res.data) {
        setCreatedConsultation(res.data);
        setCompletedModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to record consultation:", err);
      const errMsg = err.response?.data?.message || "Failed to finalize consultation encounter.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !appointment) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/doctor/appointments")}>
          Return to Queue
        </Button>
      </Container>
    );
  }

  const patient = appointment?.patient;
  const allergiesList = patient?.allergies ? patient.allergies.split(",").map((s) => s.trim()) : [];

  return (
    <Box sx={{ py: 3, bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50", minHeight: "90vh" }}>
      <Container maxWidth="xl">
        {/* Top Header Bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/doctor/appointments")}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Queue
            </Button>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                Clinical Encounter Room
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Booking Ref: {appointment?.booking_reference} • Branch: {appointment?.branch?.branch_name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {appointment?.is_emergency && (
              <Chip
                label="EMERGENCY TRIAGE"
                color="error"
                size="small"
                sx={{ fontWeight: 800, animation: "pulse 1.5s infinite" }}
              />
            )}
            <Chip
              label={`Date: ${appointment?.appointment_date}`}
              icon={<CalendarMonth fontSize="small" />}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Time: ${appointment?.start_time} - ${appointment?.end_time}`}
              icon={<AccessTime fontSize="small" />}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* LEFT COLUMN: Patient EHR Summary & Past Clinical History */}
          <Grid item xs={12} lg={4}>
            {/* Patient Identity & Insurance Card */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                bgcolor: "background.paper",
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 54,
                      height: 54,
                      bgcolor: "primary.main",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                    }}
                  >
                    {patient?.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {patient?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Patient #{patient?.patient_number || "PT-N/A"} • {patient?.gender}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {patient?.dob || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Contact Phone
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {patient?.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Insurance Coverage
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={
                          patient?.insurance_provider
                            ? `${patient.insurance_provider} (${patient.coverage_percentage}%)`
                            : "Self Pay"
                        }
                        color="success"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* ALLERGIES WARNING BOX */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: allergiesList.length > 0 ? "error.lighter" : "success.lighter",
                    border: `1px solid ${allergiesList.length > 0 ? theme.palette.error.light : theme.palette.success.light}`,
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Warning color={allergiesList.length > 0 ? "error" : "success"} fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      color={allergiesList.length > 0 ? "error.main" : "success.main"}
                      sx={{ fontWeight: 700 }}
                    >
                      Allergies & Contraindications
                    </Typography>
                  </Box>
                  {allergiesList.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1 }}>
                      {allergiesList.map((allergy, idx) => (
                        <Chip
                          key={idx}
                          label={allergy}
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No documented drug or food allergies.
                    </Typography>
                  )}
                </Box>

                {/* Chronic Medical History */}
                <Typography variant="caption" color="text.secondary">
                  Past Medical Conditions:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {patient?.medical_history || "No prior major chronic illnesses reported."}
                </Typography>
              </CardContent>
            </Card>

            {/* Past Consultations Accordion Timeline */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                bgcolor: "background.paper",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <History color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Patient Consultation History ({patientHistory.length})
                  </Typography>
                </Box>

                {patientHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                    No prior consultations recorded for this patient.
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: "400px", overflowY: "auto", pr: 0.5 }}>
                    {patientHistory.map((hist, idx) => (
                      <Accordion key={hist.id || idx} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 1, borderRadius: 1.5, "&:before": { display: "none" } }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {hist.diagnosis}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {hist.created_at?.slice(0, 10)} • Dr. {hist.doctor?.name}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Symptoms: {hist.symptoms}
                          </Typography>
                          {hist.treatment_plan && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              Plan: {hist.treatment_plan}
                            </Typography>
                          )}
                          {hist.prescriptions && hist.prescriptions.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                Prescribed Medications:
                              </Typography>
                              {hist.prescriptions.map((rx) =>
                                rx.items?.map((item, i) => (
                                  <Typography key={i} variant="caption" sx={{ display: "block", color: "primary.main" }}>
                                    • {item.medicine_name} ({item.dosage}, {item.frequency})
                                  </Typography>
                                ))
                              )}
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT COLUMN: Active Clinical Encounter */}
          <Grid item xs={12} lg={8}>
            {/* 1. Presenting Symptoms */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                bgcolor: "background.paper",
                mb: 2.5,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Chief Complaint & Presenting Symptoms *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Record patient complaints, symptom duration, severity, and onset..."
                />
              </CardContent>
            </Card>

            {/* 2. Vitals Signs Card */}
            <VitalsEntryCard vitals={vitals} onChange={setVitals} />

            {/* 3. Primary Diagnosis & Quick Selectors */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                bgcolor: "background.paper",
                mb: 2.5,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Primary Clinical Diagnosis *
                </Typography>

                <TextField
                  fullWidth
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter clinical diagnosis or ICD code..."
                  sx={{ mb: 1.5 }}
                />

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, fontWeight: 600 }}>
                    Common Rwandan Diagnoses:
                  </Typography>
                  {COMMON_DIAGNOSES.map((diag, idx) => (
                    <Chip
                      key={idx}
                      label={diag}
                      size="small"
                      onClick={() => setDiagnosis(diag)}
                      color={diagnosis === diag ? "primary" : "default"}
                      sx={{ cursor: "pointer", fontSize: "0.75rem" }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* 4. Clinical Examination Notes & Treatment Plan */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2.5,
                bgcolor: "background.paper",
                mb: 2.5,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Physical Examination & Clinical Notes
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                      placeholder="Chest auscultation, abdominal palpation, heart sounds..."
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Treatment Recommendations & Lifestyle Plan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      placeholder="Rest, hydration, dietary restrictions, monitoring advice..."
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Follow-up Review Date (Optional)
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 5. Integrated Electronic Prescription Builder */}
            <PrescriptionBuilder
              prescriptionItems={prescriptionItems}
              onChange={setPrescriptionItems}
              generalInstructions={generalInstructions}
              onInstructionsChange={setGeneralInstructions}
              patientInsurance={patient?.insurance_provider ? {
                provider_name: patient.insurance_provider,
                coverage_percentage: patient.coverage_percentage,
              } : null}
            />

            {/* Final Action Submission Bar */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 4 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/doctor/appointments")}
                sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                onClick={handleSubmitEncounter}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 4,
                  boxShadow: theme.shadows[4],
                }}
              >
                {submitting ? "Finalizing Encounter..." : "Finalize & Complete Encounter"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Completion & Printable Voucher Dialog */}
      <Dialog
        open={completedModalOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <CheckCircle color="success" sx={{ fontSize: 50, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Consultation Encounter Completed!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Appointment status transitioned to Completed • EHR updated
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Diagnosis: {createdConsultation?.diagnosis}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Patient: {patient?.name} (#{patient?.patient_number})
            </Typography>

            {createdConsultation?.prescriptions && createdConsultation.prescriptions.length > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                  Electronic Prescription Issued: {createdConsultation.prescriptions[0]?.prescription_number}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {createdConsultation.prescriptions[0]?.items?.length || 0} medications queued for hospital dispensary.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={() => {
              setCompletedModalOpen(false);
              navigate("/doctor/appointments");
            }}
          >
            Return to Appointments Queue
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print Consultation Summary
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorConsultationRoom;
