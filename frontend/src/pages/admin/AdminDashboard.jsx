import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  TrendingUp,
  People,
  CalendarToday,
  LocalHospital,
  AccountBalanceWallet,
  Security,
  FileDownload,
  CheckCircle,
  Business,
  Receipt,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import adminApi from "../../api/admin";

const CHART_COLORS = ["#0D9488", "#2563EB", "#9333EA", "#EA580C", "#16A34A", "#F59E0B", "#06B6D4"];

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [departmentWorkloads, setDepartmentWorkloads] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, trendsRes, branchRes, deptRes] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getAppointmentTrends({ days: 14 }),
        adminApi.getRevenueByBranch(),
        adminApi.getDepartmentWorkloads(),
      ]);

      setOverview(overviewRes.data);
      setAppointmentTrends(trendsRes.data || []);
      setBranchRevenue(branchRes.data || []);
      setDepartmentWorkloads(deptRes.data || []);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
      setError("Unable to load executive metrics. Please check network connection and administrator privileges.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await adminApi.downloadExecutiveReportPdf();
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate executive report PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress size={48} sx={{ color: "#0D9488", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Assembling Healthcare Network Analytics & Executive Metrics...
        </Typography>
      </Container>
    );
  }

  const kpis = [
    {
      label: "Total Revenue Collected",
      value: overview?.formatted_revenue || `${Number(overview?.total_revenue_rwf || 0).toLocaleString()} RWF`,
      sub: "Settled patient & counter payments",
      icon: <AccountBalanceWallet sx={{ fontSize: 28, color: "#0D9488" }} />,
      bgColor: "#F0FDFA",
      borderColor: "#CCFBF1",
    },
    {
      label: "Registered Patients",
      value: Number(overview?.total_patients || 0).toLocaleString(),
      sub: "Across 5 provincial branches",
      icon: <People sx={{ fontSize: 28, color: "#2563EB" }} />,
      bgColor: "#EFF6FF",
      borderColor: "#DBEAFE",
    },
    {
      label: "Total Appointments",
      value: Number(overview?.total_appointments || 0).toLocaleString(),
      sub: `${overview?.completed_appointments || 0} completed encounters`,
      icon: <CalendarToday sx={{ fontSize: 28, color: "#16A34A" }} />,
      bgColor: "#F0FDF4",
      borderColor: "#DCFCE7",
    },
    {
      label: "Approved Insurance Claims",
      value: overview?.formatted_approved_claims || `${Number(overview?.total_approved_claims_rwf || 0).toLocaleString()} RWF`,
      sub: "RSSB, CBHI, MMI, Radiant, Sanlam",
      icon: <Security sx={{ fontSize: 28, color: "#9333EA" }} />,
      bgColor: "#FAF5FF",
      borderColor: "#F3E8FF",
    },
    {
      label: "Outstanding Balances",
      value: overview?.formatted_outstanding || `${Number(overview?.outstanding_balances_rwf || 0).toLocaleString()} RWF`,
      sub: "Pending patient copay invoices",
      icon: <Receipt sx={{ fontSize: 28, color: "#EA580C" }} />,
      bgColor: "#FFF7ED",
      borderColor: "#FFEDD5",
    },
    {
      label: "Active Attending Doctors",
      value: Number(overview?.total_doctors || 0).toLocaleString(),
      sub: "Full-time licensed physicians",
      icon: <LocalHospital sx={{ fontSize: 28, color: "#06B6D4" }} />,
      bgColor: "#ECFEFF",
      borderColor: "#CFFAFE",
    },
  ];

  const branches = [
    { name: "Kigali Central Hospital", province: "Kigali City", district: "Nyarugenge", status: "Active" },
    { name: "Karongi Referral Hospital", province: "Western Province", district: "Karongi", status: "Active" },
    { name: "Musanze Memorial Clinic", province: "Northern Province", district: "Musanze", status: "Active" },
    { name: "Rwamagana Family Care", province: "Eastern Province", district: "Rwamagana", status: "Active" },
    { name: "Huye Specialized Hospital", province: "Southern Province", district: "Huye", status: "Active" },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header & Quick Action Hub */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A" }}>
                Executive Command Center
              </Typography>
              <Chip
                label="RP Karongi Healthcare Network"
                size="small"
                sx={{
                  bgcolor: "#CCFBF1",
                  color: "#0F766E",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Real-time operational oversight, provincial branch performance, and financial analytics for the Republic of Rwanda.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                startIcon={<People />}
                onClick={() => navigate("/admin/users")}
                sx={{ borderColor: "#CBD5E1", color: "#334155" }}
              >
                Users & Staff
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Security />}
                onClick={() => navigate("/admin/audit-logs")}
                sx={{ borderColor: "#CBD5E1", color: "#334155" }}
              >
                Audit Trail
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TrendingUp />}
                onClick={() => navigate("/admin/reports")}
                sx={{ borderColor: "#CBD5E1", color: "#334155" }}
              >
                Export Hub
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={downloadingPdf ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                sx={{ bgcolor: "#0D9488", "&:hover": { bgcolor: "#0F766E" }, fontWeight: 700 }}
              >
                Executive PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} lg={4} key={idx}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: kpi.bgColor,
                border: "1px solid",
                borderColor: kpi.borderColor,
                borderRadius: 2.5,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {kpi.label}
                </Typography>
                <Box sx={{ p: 1, bgcolor: "#FFFFFF", borderRadius: 2, display: "flex", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
                {kpi.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {kpi.sub}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analytics Visualizations Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 1. Appointment Volume Trends */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, height: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  14-Day Appointment Encounter Dynamics
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Daily total bookings vs completed clinical consultations
                </Typography>
              </Box>
              <Chip label="Real-time Stream" size="small" sx={{ bgcolor: "#F0FDF4", color: "#166534", fontWeight: 600 }} />
            </Box>

            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={appointmentTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="formatted_date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", borderRadius: 8, color: "#FFFFFF", border: "none" }}
                    labelStyle={{ color: "#94A3B8", fontWeight: 600 }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="total" name="Total Bookings" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#totalGrad)" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#completedGrad)" />
                  <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#DC2626" strokeWidth={1.5} fillOpacity={0.1} fill="#DC2626" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* 2. Department Workloads Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Clinical Department Load
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Consultation distribution by specialty
            </Typography>

            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentWorkloads}
                    dataKey="consultation_count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {departmentWorkloads.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", borderRadius: 8, color: "#FFFFFF", border: "none" }}
                    formatter={(val, name) => [`${val} Consultations`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Stack spacing={1} sx={{ mt: 1, maxHeight: 110, overflowY: "auto", pr: 0.5 }}>
              {departmentWorkloads.map((dept, index) => (
                <Box key={dept.department_id || index} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155" }}>
                      {dept.name}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A" }}>
                    {dept.consultation_count} ({dept.percentage}%)
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* 3. Provincial Branch Revenue Bar Chart */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  Hospital Branch Revenue Distribution (RWF)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comparative gross collections across Rwandan provincial hospital facilities
                </Typography>
              </Box>
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate("/admin/reports")}
                sx={{ color: "#0D9488", fontWeight: 700 }}
              >
                Detailed Ledger
              </Button>
            </Box>

            <Box sx={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchRevenue} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="branch_name" stroke="#94A3B8" fontSize={11} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(val) => `${Number(val / 1000).toLocaleString()}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", borderRadius: 8, color: "#FFFFFF", border: "none" }}
                    formatter={(val) => [`${Number(val).toLocaleString()} RWF`, "Revenue"]}
                  />
                  <Bar dataKey="revenue_rwf" name="Revenue Collected" fill="#0D9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Provincial Facilities Network Summary */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Business sx={{ color: "#0D9488" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
              Provincial Healthcare Facilities Network
            </Typography>
          </Stack>
          <Chip label="5 Branches Active" size="small" sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700 }} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Facility Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Province</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>District</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Operational Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((b, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>{b.name}</TableCell>
                  <TableCell>{b.province}</TableCell>
                  <TableCell>{b.district}</TableCell>
                  <TableCell>
                    <Chip label={b.status} size="small" icon={<CheckCircle sx={{ fontSize: "14px !important" }} />} sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate("/admin/users")} sx={{ textTransform: "none", color: "#0D9488" }}>
                      Manage Staff
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
