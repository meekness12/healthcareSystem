import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from "@mui/material";
import {
  HistoryEdu,
  Medication,
  AttachFile,
  Warning,
  Person,
  Print,
  CloudUpload,
  Download,
  CalendarMonth,
  LocalHospital,
  Speed,
  Favorite,
  DeviceThermostat,
  Air,
  CheckCircle,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import consultationApi from "../../api/consultation";
import prescriptionApi from "../../api/prescription";
import medicalRecordApi from "../../api/medicalRecord";
import PrescriptionVoucherModal from "../../components/prescriptions/PrescriptionVoucherModal";

const MedicalRecords = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0); // 0: Encounters, 1: Prescriptions, 2: Documents
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [files, setFiles] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modal State for Viewing Printable Prescription
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // File Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAllPatientEHR = async () => {
      try {
        setLoading(true);
        // 1. Fetch consultations history (which also includes patient demographic & insurance profile)
        const patientId = user?.patient?.id;
        if (!patientId) {
          // If user object doesn't have patient nested yet, we can fetch via current user
          const histRes = await consultationApi.getConsultations();
          if (histRes.success && histRes.data) {
            setConsultations(histRes.data);
            if (histRes.data[0]?.patient) {
              setPatientData(histRes.data[0].patient);
            }
          }
        } else {
          const histRes = await consultationApi.getPatientHistory(patientId);
          if (histRes.success) {
            setConsultations(histRes.data || []);
            setPatientData(histRes.patient || null);
          }
        }

        // 2. Fetch Prescriptions
        try {
          const rxRes = await prescriptionApi.getPrescriptions();
          if (rxRes.success && rxRes.data) {
            setPrescriptions(rxRes.data);
          }
        } catch (err) {
          console.warn("Could not load prescriptions:", err);
        }

        // 3. Fetch Uploaded Medical Documents
        const pId = patientId || user?.patient?.id;
        if (pId) {
          try {
            const filesRes = await medicalRecordApi.getMedicalFiles(pId);
            if (filesRes.success && filesRes.data) {
              setFiles(filesRes.data);
            }
          } catch (err) {
            console.warn("Could not load medical files:", err);
          }
        }
      } catch (err) {
        console.error("Failed to load patient EHR records:", err);
        setFeedback({ type: "error", message: "Failed to retrieve medical records." });
      } finally {
        setLoading(false);
      }
    };

    fetchAllPatientEHR();
  }, [user]);

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: "error", message: "Please select a file to upload." });
      return;
    }

    const patientId = patientData?.id || user?.patient?.id;
    if (!patientId) {
      setFeedback({ type: "error", message: "Patient profile not found for upload." });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (fileLabel) {
        formData.append("file_name", fileLabel);
      }

      const res = await medicalRecordApi.uploadMedicalFile(patientId, formData);
      if (res.success && res.data) {
        setFiles([res.data, ...files]);
        setSelectedFile(null);
        setFileLabel("");
        setFeedback({ type: "success", message: "Medical document uploaded successfully." });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      const msg = err.response?.data?.message || "Failed to upload document.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setUploading(false);
    }
  };

  const allergiesList = patientData?.allergies ? patientData.allergies.split(",").map((s) => s.trim()) : [];

  return (
    <Box sx={{ py: 4, bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50", minHeight: "90vh" }}>
      <Container maxWidth="xl">
        {/* Top Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Electronic Health Records (EHR)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive Medical History, Doctor Clinical Consultations, Prescriptions & Diagnostic Reports
          </Typography>
        </Box>

        {feedback.message && (
          <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback({ type: "", message: "" })}>
            {feedback.message}
          </Alert>
        )}

        {/* Patient Health Profile Card */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            p: 3,
            mb: 3.5,
            bgcolor: "background.paper",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: "primary.main",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                  }}
                >
                  {user?.name?.charAt(0) || "P"}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patient #{patientData?.patient_number || "PT-HEALTH-RW"}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: "flex", gap: 1 }}>
                    <Chip label={`Gender: ${patientData?.gender || "N/A"}`} size="small" variant="outlined" />
                    <Chip label={`DOB: ${patientData?.dob || "N/A"}`} size="small" variant="outlined" />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Insurance Information */}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50", border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  HEALTH INSURANCE COVERAGE
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {patientData?.insurance_provider || "RSSB / RAMA (Rwanda Social Security Board)"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Policy #: {patientData?.insurance_number || "RAMA-2026-99210"}
                </Typography>
              </Box>
            </Grid>

            {/* Allergies Warning */}
            <Grid item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: allergiesList.length > 0 ? "error.lighter" : "success.lighter",
                  border: `1px solid ${allergiesList.length > 0 ? theme.palette.error.light : theme.palette.success.light}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Warning color={allergiesList.length > 0 ? "error" : "success"} fontSize="small" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }} color={allergiesList.length > 0 ? "error.main" : "success.main"}>
                    ALLERGIES & CONTRAINDICATIONS
                  </Typography>
                </Box>
                {allergiesList.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.8 }}>
                    {allergiesList.map((allergy, i) => (
                      <Chip key={i} label={allergy} size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    No documented drug allergies.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem" },
            }}
          >
            <Tab icon={<HistoryEdu />} iconPosition="start" label={`Consultations (${consultations.length})`} />
            <Tab icon={<Medication />} iconPosition="start" label={`Prescriptions (${prescriptions.length})`} />
            <Tab icon={<AttachFile />} iconPosition="start" label={`Diagnostic Files (${files.length})`} />
          </Tabs>
        </Box>

        {/* TAB 0: Clinical Consultations History */}
        {activeTab === 0 && (
          <Box>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : consultations.length === 0 ? (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 4, textAlign: "center", borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No clinical consultation visits recorded yet. Your medical records will appear here after a doctor completes an encounter.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {consultations.map((enc) => (
                  <Card
                    key={enc.id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      p: 2.5,
                      bgcolor: "background.paper",
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {enc.diagnosis}
                          </Typography>
                          <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Date: {enc.created_at?.slice(0, 10)} • Attending Clinician: Dr. {enc.doctor?.name} ({enc.doctor?.specialty || "Specialist"}) • Branch: {enc.appointment?.branch_name || "Karongi Hospital"}
                        </Typography>
                      </Box>

                      {enc.follow_up_date && (
                        <Chip
                          label={`Follow-up: ${enc.follow_up_date}`}
                          color="info"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Vitals Summary Pill Bar if vitals exist */}
                    {enc.vitals && Object.values(enc.vitals).some((v) => v !== null) && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                          border: `1px solid ${theme.palette.divider}`,
                          mb: 2,
                        }}
                      >
                        {enc.vitals.blood_pressure_systolic && (
                          <Chip
                            icon={<Speed fontSize="small" />}
                            label={`BP: ${enc.vitals.blood_pressure_systolic}/${enc.vitals.blood_pressure_diastolic} mmHg`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {enc.vitals.heart_rate && (
                          <Chip
                            icon={<Favorite fontSize="small" color="error" />}
                            label={`Heart Rate: ${enc.vitals.heart_rate} bpm`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {enc.vitals.temperature && (
                          <Chip
                            icon={<DeviceThermostat fontSize="small" color="warning" />}
                            label={`Temp: ${enc.vitals.temperature} °C`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {enc.vitals.spo2 && (
                          <Chip
                            icon={<Air fontSize="small" color="info" />}
                            label={`SpO2: ${enc.vitals.spo2}%`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}

                    {/* Clinical Details */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          CHIEF COMPLAINT / SYMPTOMS:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {enc.symptoms}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          TREATMENT RECOMMENDATIONS:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {enc.treatment_plan || "Standard outpatient monitoring."}
                        </Typography>
                      </Grid>

                      {enc.consultation_notes && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            CLINICAL NOTES & OBSERVATIONS:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
                            {enc.consultation_notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {/* Prescriptions Linked to this Consultation */}
                    {enc.prescriptions && enc.prescriptions.length > 0 && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                            Electronic Prescriptions ({enc.prescriptions.length})
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Print />}
                            onClick={() => setSelectedPrescription(enc.prescriptions[0])}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                          >
                            View & Print Prescription
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* TAB 1: Prescriptions List */}
        {activeTab === 1 && (
          <Box>
            {prescriptions.length === 0 ? (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 4, textAlign: "center", borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No electronic prescriptions on record.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {prescriptions.map((rx) => (
                  <Card
                    key={rx.id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      p: 2.5,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                            {rx.prescription_number}
                          </Typography>
                          <Chip
                            label={rx.status.toUpperCase()}
                            color={rx.status === "dispensed" ? "success" : rx.status === "issued" ? "primary" : "default"}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Issued Date: {rx.prescription_date} • Prescribing Doctor: Dr. {rx.doctor?.name} ({rx.doctor?.license_number})
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<Print />}
                        onClick={() => setSelectedPrescription(rx)}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                      >
                        Print Official Rx Pass
                      </Button>
                    </Box>

                    {/* Medications Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Dosage Form</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Directions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rx.items?.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{item.medicine_name}</TableCell>
                              <TableCell sx={{ textTransform: "capitalize" }}>{item.dosage_form || "Tablet"}</TableCell>
                              <TableCell>{item.frequency}</TableCell>
                              <TableCell>{item.duration_days} days</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{item.quantity_prescribed}</TableCell>
                              <TableCell>{item.instructions || "Take as instructed"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* TAB 2: Diagnostic Scans & Uploaded Files */}
        {activeTab === 2 && (
          <Box>
            {/* File Upload Box */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 3,
                mb: 3.5,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Upload Diagnostic Report or Referral Document
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Attach external PDF laboratory reports, ultrasound scans, or diagnostic images (Max: 5MB, accepted: PDF, JPG, PNG).
              </Typography>

              <form onSubmit={handleUploadFile}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Document Title (e.g. Karongi Blood Test PDF)"
                      value={fileLabel}
                      onChange={(e) => setFileLabel(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={5}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      size="medium"
                      startIcon={<CloudUpload />}
                      sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                      {selectedFile ? selectedFile.name : "Select Document (PDF/JPG/PNG)"}
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                      />
                    </Button>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={uploading || !selectedFile}
                      startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                    >
                      {uploading ? "Uploading..." : "Upload File"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Card>

            {/* List of Files */}
            {files.length === 0 ? (
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 4, textAlign: "center", borderRadius: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No medical documents attached yet.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {files.map((file) => (
                  <Grid item xs={12} sm={6} md={4} key={file.id}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2.5,
                        p: 2,
                        bgcolor: "background.paper",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: "primary.lighter", color: "primary.main" }}>
                            <AttachFile />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {file.file_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Format: {file.file_type?.toUpperCase()} • {file.created_at?.slice(0, 10)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Uploaded by: {file.uploaded_by?.name || "Patient"}
                            </Typography>
                          </Box>
                        </Box>

                        <IconButton
                          color="primary"
                          size="small"
                          component="a"
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>

      {/* Printable Prescription Sheet Modal */}
      <PrescriptionVoucherModal
        open={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />
    </Box>
  );
};

export default MedicalRecords;
