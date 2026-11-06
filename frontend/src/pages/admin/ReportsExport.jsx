import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Stack,
  Divider,
} from "@mui/material";
import {
  PictureAsPdf,
  TableChart,
  AccountBalanceWallet,
  Security,
  CalendarToday,
  FileDownload,
  Business,
  CheckCircle,
} from "@mui/icons-material";
import adminApi from "../../api/admin";
import branchApi from "../../api/branch";

const ReportsExport = () => {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Download states
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingApptsCsv, setDownloadingApptsCsv] = useState(false);
  const [downloadingRevCsv, setDownloadingRevCsv] = useState(false);
  const [downloadingAuditCsv, setDownloadingAuditCsv] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filters for Appointments CSV
  const [apptBranchId, setApptBranchId] = useState("");
  const [apptStatus, setApptStatus] = useState("");
  const [apptDateFrom, setApptDateFrom] = useState("");
  const [apptDateTo, setApptDateTo] = useState("");

  // Filters for Revenue CSV
  const [revMethod, setRevMethod] = useState("");
  const [revStatus, setRevStatus] = useState("");
  const [revDateFrom, setRevDateFrom] = useState("");
  const [revDateTo, setRevDateTo] = useState("");

  // Filters for Audit CSV
  const [auditAction, setAuditAction] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await branchApi.getBranches();
      setBranches(res.data || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      setErrorMsg(null);
      await adminApi.downloadExecutiveReportPdf();
      setFeedbackMsg("Executive PDF report generated and downloaded successfully.");
    } catch (err) {
      console.error("PDF download failed:", err);
      setErrorMsg("Failed to generate executive report PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadApptsCsv = async () => {
    try {
      setDownloadingApptsCsv(true);
      setErrorMsg(null);
      const params = {};
      if (apptBranchId) params.branch_id = apptBranchId;
      if (apptStatus) params.status = apptStatus;
      if (apptDateFrom) params.date_from = apptDateFrom;
      if (apptDateTo) params.date_to = apptDateTo;

      await adminApi.downloadAppointmentsCsv(params);
      setFeedbackMsg("Appointments dataset CSV successfully streamed.");
    } catch (err) {
      console.error("CSV download failed:", err);
      setErrorMsg("Failed to stream appointments CSV.");
    } finally {
      setDownloadingApptsCsv(false);
    }
  };

  const handleDownloadRevCsv = async () => {
    try {
      setDownloadingRevCsv(true);
      setErrorMsg(null);
      const params = {};
      if (revMethod) params.payment_method = revMethod;
      if (revStatus) params.payment_status = revStatus;
      if (revDateFrom) params.date_from = revDateFrom;
      if (revDateTo) params.date_to = revDateTo;

      await adminApi.downloadRevenueCsv(params);
      setFeedbackMsg("Revenue transactions dataset CSV successfully streamed.");
    } catch (err) {
      console.error("CSV download failed:", err);
      setErrorMsg("Failed to stream revenue CSV.");
    } finally {
      setDownloadingRevCsv(false);
    }
  };

  const handleDownloadAuditCsv = async () => {
    try {
      setDownloadingAuditCsv(true);
      setErrorMsg(null);
      const params = {};
      if (auditAction) params.action = auditAction;
      if (auditDateFrom) params.date_from = auditDateFrom;
      if (auditDateTo) params.date_to = auditDateTo;

      await adminApi.downloadAuditLogsCsv(params);
      setFeedbackMsg("Security audit trail dataset CSV successfully streamed.");
    } catch (err) {
      console.error("CSV download failed:", err);
      setErrorMsg("Failed to stream audit logs CSV.");
    } finally {
      setDownloadingAuditCsv(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
          Executive Reports & Intelligence Export Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Download certified PDF management briefs and stream real-time CSV data feeds for external audit and analytics.
        </Typography>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {feedbackMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setFeedbackMsg(null)}>
          {feedbackMsg}
        </Alert>
      )}

      {/* Hero: 1-Click Executive PDF Report Card */}
      <Card
        elevation={0}
        sx={{
          p: 3.5,
          bgcolor: "#F0FDFA",
          border: "2px solid #CCFBF1",
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PictureAsPdf sx={{ color: "#0D9488", fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F766E" }}>
                Executive Healthcare Network Performance Report (PDF)
              </Typography>
              <Chip label="DomPDF Certified" size="small" sx={{ bgcolor: "#0D9488", color: "#FFFFFF", fontWeight: 700 }} />
            </Stack>
            <Typography variant="body2" sx={{ color: "#334155", maxWidth: 750 }}>
              Formally structured executive brief formatted for Ministry of Health compliance and RP Karongi College academic evaluation.
              Includes high-level KPIs, provincial branch revenue aggregations, departmental workload ratios, insurance claim approvals, and director certification stamp.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={downloadingPdf ? <CircularProgress size={20} color="inherit" /> : <FileDownload />}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              sx={{
                bgcolor: "#0D9488",
                "&:hover": { bgcolor: "#0F766E" },
                px: 3.5,
                py: 1.5,
                fontWeight: 800,
                fontSize: "0.95rem",
                borderRadius: 2,
              }}
            >
              {downloadingPdf ? "Compiling PDF..." : "Generate Official Report"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* CSV Datasets Grid */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 2 }}>
        Operational CSV Data Streams
      </Typography>

      <Grid container spacing={3}>
        {/* 1. Appointments CSV */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <CalendarToday sx={{ color: "#2563EB" }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  Appointments Stream
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Complete booking schedule records including doctor, branch, type, status, and patient NIN.
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Hospital Branch"
                  value={apptBranchId}
                  onChange={(e) => setApptBranchId(e.target.value)}
                >
                  <MenuItem value="">All Provincial Branches</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.branch_name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Encounter Status"
                  value={apptStatus}
                  onChange={(e) => setApptStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      label="From"
                      InputLabelProps={{ shrink: true }}
                      value={apptDateFrom}
                      onChange={(e) => setApptDateFrom(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      label="To"
                      InputLabelProps={{ shrink: true }}
                      value={apptDateTo}
                      onChange={(e) => setApptDateTo(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={downloadingApptsCsv ? <CircularProgress size={16} /> : <FileDownload />}
              onClick={handleDownloadApptsCsv}
              disabled={downloadingApptsCsv}
              sx={{ borderColor: "#2563EB", color: "#2563EB", fontWeight: 700 }}
            >
              Stream Appointments CSV
            </Button>
          </Paper>
        </Grid>

        {/* 2. Revenue & Transactions CSV */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <AccountBalanceWallet sx={{ color: "#16A34A" }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  Financial Revenue Ledger
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Itemized payment transactions with MTN MoMo, Airtel, card, or cash references and settled amounts.
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Payment Channel"
                  value={revMethod}
                  onChange={(e) => setRevMethod(e.target.value)}
                >
                  <MenuItem value="">All Payment Channels</MenuItem>
                  <MenuItem value="momo">MTN Mobile Money (*182#)</MenuItem>
                  <MenuItem value="airtel_money">Airtel Money (*182#)</MenuItem>
                  <MenuItem value="card">Visa / Mastercard</MenuItem>
                  <MenuItem value="cash">Counter Cash Settlement</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Payment Status"
                  value={revStatus}
                  onChange={(e) => setRevStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="successful">Successful / Settled</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </TextField>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      label="From"
                      InputLabelProps={{ shrink: true }}
                      value={revDateFrom}
                      onChange={(e) => setRevDateFrom(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      label="To"
                      InputLabelProps={{ shrink: true }}
                      value={revDateTo}
                      onChange={(e) => setRevDateTo(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={downloadingRevCsv ? <CircularProgress size={16} /> : <FileDownload />}
              onClick={handleDownloadRevCsv}
              disabled={downloadingRevCsv}
              sx={{ borderColor: "#16A34A", color: "#16A34A", fontWeight: 700 }}
            >
              Stream Revenue CSV
            </Button>
          </Paper>
        </Grid>

        {/* 3. Security Audit Trail CSV */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Security sx={{ color: "#9333EA" }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  Security Audit Trail Log
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Comprehensive forensic trail of user registrations, clinical consultations, and billing actions.
              </Typography>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Action Event"
                  value={auditAction}
                  onChange={(e) => setAuditAction(e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="USER_CREATED">USER_CREATED</MenuItem>
                  <MenuItem value="USER_STATUS_TOGGLED">USER_STATUS_TOGGLED</MenuItem>
                  <MenuItem value="payment_processed">payment_processed</MenuItem>
                  <MenuItem value="appointment_booked">appointment_booked</MenuItem>
                  <MenuItem value="consultation_recorded">consultation_recorded</MenuItem>
                </TextField>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      label="From"
                      InputLabelProps={{ shrink: true }}
                      value={auditDateFrom}
                      onChange={(e) => setAuditDateFrom(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      size="small"
                      fullWidth
                      type="date"
                      label="To"
                      InputLabelProps={{ shrink: true }}
                      value={auditDateTo}
                      onChange={(e) => setAuditDateTo(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={downloadingAuditCsv ? <CircularProgress size={16} /> : <FileDownload />}
              onClick={handleDownloadAuditCsv}
              disabled={downloadingAuditCsv}
              sx={{ borderColor: "#9333EA", color: "#9333EA", fontWeight: 700 }}
            >
              Stream Audit Logs CSV
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportsExport;
