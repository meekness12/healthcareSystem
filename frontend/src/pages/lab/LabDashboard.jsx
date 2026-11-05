import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import {
  Biotech,
  CheckCircle,
  Schedule,
  Warning,
  Person,
  PictureAsPdf,
  CloudUpload,
  PlayArrow,
  AssignmentTurnedIn,
  LocalHospital,
  Science,
  Download,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import labApi from "../../api/lab";

const LabDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Pending, 2: In Progress, 3: Emergency/Urgent, 4: Completed
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Record Result Dialog State
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultSummary, setResultSummary] = useState("");
  const [referenceRanges, setReferenceRanges] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [submittingResult, setSubmittingResult] = useState(false);

  // Result Detail Viewer Dialog State
  const [viewResultTest, setViewResultTest] = useState(null);

  const fetchLabQueue = async () => {
    try {
      setLoading(true);
      const res = await labApi.getLabTests();
      if (res.success && res.data) {
        setTests(res.data);
      }
    } catch (err) {
      console.error("Failed to load laboratory queue:", err);
      setFeedback({ type: "error", message: "Failed to retrieve laboratory queue." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabQueue();
  }, []);

  const handleClaimTest = async (testId) => {
    try {
      const res = await labApi.claimLabTest(testId);
      if (res.success) {
        setFeedback({ type: "success", message: "Test claimed and assigned to your diagnostic bench." });
        fetchLabQueue();
      }
    } catch (err) {
      console.error("Failed to claim test:", err);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to claim test." });
    }
  };

  const handleOpenRecordDialog = (test) => {
    setSelectedTest(test);
    setResultSummary("");
    setReferenceRanges(test.test_type?.turnaround_hours ? `Standard Turnaround: ${test.test_type.turnaround_hours}h` : "");
    setPdfFile(null);
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!resultSummary.trim()) {
      setFeedback({ type: "error", message: "Please provide a diagnostic observation summary." });
      return;
    }

    try {
      setSubmittingResult(true);
      const formData = new FormData();
      formData.append("result_summary", resultSummary);
      if (referenceRanges) {
        formData.append("reference_ranges", referenceRanges);
      }
      if (pdfFile) {
        formData.append("report_pdf", pdfFile);
      }

      const res = await labApi.recordLabResult(selectedTest.id, formData);
      if (res.success) {
        setSelectedTest(null);
        setFeedback({ type: "success", message: "Laboratory diagnostic results recorded successfully." });
        fetchLabQueue();
      }
    } catch (err) {
      console.error("Failed to record result:", err);
      setFeedback({ type: "error", message: err.response?.data?.message || "Failed to record lab result." });
    } finally {
      setSubmittingResult(false);
    }
  };

  // Filter tests by tab
  const filteredTests = tests.filter((t) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return t.status === "pending";
    if (activeTab === 2) return ["assigned", "in_progress"].includes(t.status);
    if (activeTab === 3) return ["urgent", "emergency"].includes(t.priority);
    if (activeTab === 4) return t.status === "completed";
    return true;
  });

  const pendingCount = tests.filter((t) => t.status === "pending").length;
  const inProgressCount = tests.filter((t) => ["assigned", "in_progress"].includes(t.status)).length;
  const emergencyCount = tests.filter((t) => ["urgent", "emergency"].includes(t.priority) && t.status !== "completed").length;
  const completedCount = tests.filter((t) => t.status === "completed").length;

  return (
    <Box sx={{ py: 4, bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50", minHeight: "90vh" }}>
      <Container maxWidth="xl">
        {/* Header Banner */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Biotech color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Laboratory Diagnostic Workspace
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Karongi Hospital Diagnostic Laboratory • Logged in as: {user?.name || "Technician"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={fetchLabQueue}
              startIcon={<Science />}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Refresh Queue
            </Button>
          </Box>
        </Box>

        {feedback.message && (
          <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback({ type: "", message: "" })}>
            {feedback.message}
          </Alert>
        )}

        {/* 4 KPI Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    PENDING INTAKE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "warning.main" }}>
                    {pendingCount}
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    IN PROGRESS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "info.main" }}>
                    {inProgressCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.lighter", color: "info.main", width: 48, height: 48 }}>
                  <Science />
                </Avatar>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2.5, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    EMERGENCY / STAT
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "error.main" }}>
                    {emergencyCount}
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    COMPLETED TESTS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                    {completedCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.lighter", color: "success.main", width: 48, height: 48 }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Filters */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem" },
            }}
          >
            <Tab label={`All Orders (${tests.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`In Progress (${inProgressCount})`} />
            <Tab label={`Emergency / STAT (${emergencyCount})`} />
            <Tab label={`Completed (${completedCount})`} />
          </Tabs>
        </Box>

        {/* Diagnostic Queue Table */}
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filteredTests.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography variant="body1" color="text.secondary">
                No laboratory orders matching the selected filter.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Test / Analysis</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ordering Clinician</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned Tech</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: "primary.lighter", color: "primary.main", width: 36, height: 36 }}>
                            <Science fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {test.test_type?.test_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {test.test_type?.category} • {Number(test.test_type?.price_rwf || 0).toLocaleString()} RWF
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {test.patient?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{test.patient?.patient_number} • {test.patient?.gender}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={test.priority.toUpperCase()}
                          size="small"
                          color={
                            test.priority === "emergency"
                              ? "error"
                              : test.priority === "urgent"
                              ? "warning"
                              : "default"
                          }
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          Dr. {test.requested_by?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {test.request_date?.slice(0, 10)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color={test.assigned_to ? "text.primary" : "text.secondary"}>
                          {test.assigned_to ? test.assigned_to.name : "Unassigned"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={test.status.toUpperCase()}
                          size="small"
                          color={
                            test.status === "completed"
                              ? "success"
                              : test.status === "in_progress"
                              ? "info"
                              : "warning"
                          }
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </TableCell>

                      <TableCell sx={{ textAlign: "right" }}>
                        {test.status === "pending" && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => handleClaimTest(test.id)}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                          >
                            Claim Test
                          </Button>
                        )}

                        {["assigned", "in_progress"].includes(test.status) && (
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<AssignmentTurnedIn />}
                            onClick={() => handleOpenRecordDialog(test)}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                          >
                            Record Result
                          </Button>
                        )}

                        {test.status === "completed" && (
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setViewResultTest(test)}
                              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                            >
                              View Result
                            </Button>

                            {test.result?.report_pdf_url && (
                              <Tooltip title="Download Official PDF Report">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  component="a"
                                  href={test.result.report_pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <PictureAsPdf fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Container>

      {/* Record Diagnostic Result Dialog */}
      <Dialog
        open={Boolean(selectedTest)}
        onClose={() => setSelectedTest(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Record Laboratory Diagnostic Observations
        </DialogTitle>
        <form onSubmit={handleSubmitResult}>
          <DialogContent>
            {selectedTest && (
              <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50", borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      TEST TYPE
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedTest.test_type?.test_name} ({selectedTest.test_type?.category})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      PATIENT
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedTest.patient?.name} (#{selectedTest.patient?.patient_number})
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            <TextField
              label="Diagnostic Observation & Result Summary *"
              fullWidth
              multiline
              rows={4}
              required
              value={resultSummary}
              onChange={(e) => setResultSummary(e.target.value)}
              placeholder="e.g. Positive for Plasmodium falciparum. Ring form trophozoites observed; estimated density 14,200 parasites/uL..."
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Reference Ranges / Methodological Standard"
              fullWidth
              size="small"
              value={referenceRanges}
              onChange={(e) => setReferenceRanges(e.target.value)}
              placeholder="e.g. Normal: Negative. Method: Giemsa Stained Blood Smear (100x oil immersion)"
              sx={{ mb: 3 }}
            />

            <Box sx={{ p: 2, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Attach Official Signed PDF Report (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                Upload standardized laboratory report sheet with digital signature / stamp (PDF only, max 5MB).
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                {pdfFile ? pdfFile.name : "Select PDF Report Document"}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0] || null)}
                />
              </Button>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => setSelectedTest(null)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submittingResult}
              startIcon={submittingResult ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {submittingResult ? "Submitting..." : "Complete & Finalize Test"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Result Details Dialog */}
      <Dialog
        open={Boolean(viewResultTest)}
        onClose={() => setViewResultTest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Science color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Diagnostic Report
            </Typography>
          </Box>
          <IconButton onClick={() => setViewResultTest(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {viewResultTest && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {viewResultTest.test_type?.test_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Patient: {viewResultTest.patient?.name} (#{viewResultTest.patient?.patient_number}) • Date: {viewResultTest.result?.result_date?.slice(0, 10)}
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50", borderRadius: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  DIAGNOSTIC SUMMARY:
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {viewResultTest.result?.result_summary}
                </Typography>
              </Box>

              {viewResultTest.result?.reference_ranges && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    REFERENCE RANGES:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {viewResultTest.result?.reference_ranges}
                  </Typography>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Analyzing Technician: {viewResultTest.result?.recorded_by?.name || "Laboratory Staff"}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          {viewResultTest?.result?.report_pdf_url && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              component="a"
              href={viewResultTest.result.report_pdf_url}
              target="_blank"
              rel="noreferrer"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Download PDF Report
            </Button>
          )}
          <Button variant="outlined" onClick={() => setViewResultTest(null)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabDashboard;
