import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import {
  Security,
  Search,
  Visibility,
  FileDownload,
  Close,
  FilterList,
} from "@mui/icons-material";
import adminApi from "../../api/admin";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);

  // Details dialog
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      if (actionFilter) params.action = actionFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const res = await adminApi.getAuditLogs(params);
      setLogs(res.data || []);
      setTotalLogs(res.meta?.total || (res.data || []).length);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError("Unable to retrieve security audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleExportCsv = async () => {
    try {
      setDownloadingCsv(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.date_from = fromDate;
      if (toDate) params.date_to = toDate;
      await adminApi.downloadAuditLogsCsv(params);
    } catch (err) {
      console.error("CSV download failed:", err);
      alert("Failed to export audit logs CSV.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  const getActionChip = (action) => {
    const act = (action || "").toLowerCase();
    let bg = "#F1F5F9";
    let color = "#475569";

    if (act.includes("create") || act.includes("book") || act.includes("init")) {
      bg = "#DCFCE7";
      color = "#166534";
    } else if (act.includes("status") || act.includes("toggle") || act.includes("update")) {
      bg = "#FEF3C7";
      color = "#92400E";
    } else if (act.includes("payment") || act.includes("export")) {
      bg = "#EFF6FF";
      color = "#1E40AF";
    } else if (act.includes("delete") || act.includes("reject") || act.includes("suspend")) {
      bg = "#FEE2E2";
      color = "#991B1B";
    }

    return (
      <Chip
        label={action}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 700,
          fontSize: "0.72rem",
          fontFamily: "monospace",
        }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Security sx={{ color: "#0D9488", fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A" }}>
                Security Audit Trail & Compliance Log
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Immutable forensic log of all administrative actions, patient clinical events, and payment settlements.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Button
              variant="outlined"
              startIcon={downloadingCsv ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
              onClick={handleExportCsv}
              disabled={downloadingCsv}
              sx={{ borderColor: "#CBD5E1", color: "#334155", fontWeight: 700 }}
            >
              Export Audit CSV
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Paper */}
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleFilterSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search action, target table, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Action Filter"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="USER_CREATED">USER_CREATED</MenuItem>
                <MenuItem value="USER_STATUS_TOGGLED">USER_STATUS_TOGGLED</MenuItem>
                <MenuItem value="payment_processed">payment_processed</MenuItem>
                <MenuItem value="appointment_booked">appointment_booked</MenuItem>
                <MenuItem value="consultation_recorded">consultation_recorded</MenuItem>
                <MenuItem value="export_executive_report_pdf">export_executive_report_pdf</MenuItem>
                <MenuItem value="auth_login">auth_login</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6} sm={2}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={6} sm={2}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={1}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{ bgcolor: "#0D9488", "&:hover": { bgcolor: "#0F766E" }, minWidth: 0 }}
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Audit Log Table */}
      <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Log ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Timestamp (CAT)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Actor (User)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Action Event</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Target Entity</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>IP Address</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Payload</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colspan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#0D9488" }} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colspan={7} align="center" sx={{ py: 6, color: "#94A3B8" }}>
                    No audit records matching current search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontFamily: "monospace", color: "#64748B" }}>
                      #{log.id}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                        {log.user_name || "System"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.user_role || "automated"}
                      </Typography>
                    </TableCell>
                    <TableCell>{getActionChip(log.action)}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#334155" }}>
                        {log.target_table ? `${log.target_table} #${log.target_id || ""}` : "System Global"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#64748B" }}>
                      {log.ip_address || "127.0.0.1"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Inspect Details Payload">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailsModal(true);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalLogs}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[15, 25, 50, 100]}
        />
      </Paper>

      {/* Inspect Details Dialog */}
      <Dialog open={openDetailsModal} onClose={() => setOpenDetailsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Audit Record #{selectedLog?.id} Details
          </Typography>
          <IconButton onClick={() => setOpenDetailsModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Action</Typography>
                <Box sx={{ mt: 0.5 }}>{getActionChip(selectedLog.action)}</Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Actor</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedLog.user_name || "System"} ({selectedLog.user_role || "system"})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedLog.user_email || "system@healthcare.gov.rw"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Network Client IP</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {selectedLog.ip_address || "127.0.0.1"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Target Table</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {selectedLog.target_table || "None"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Target Record ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {selectedLog.target_id || "None"}
                  </Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" color="text.secondary">Raw JSON Payload & Context</Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mt: 0.5,
                    bgcolor: "#0F172A",
                    color: "#38BDF8",
                    fontFamily: "monospace",
                    fontSize: "0.82rem",
                    borderRadius: 2,
                    overflowX: "auto",
                    maxHeight: 250,
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenDetailsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuditLogs;
