import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  Tabs,
  Tab,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Stack,
  InputAdornment,
  Avatar,
  TablePagination,
} from "@mui/material";
import {
  Search,
  PersonAdd,
  Block,
  CheckCircle,
  Visibility,
  LocalHospital,
  People,
  Biotech,
  LocalPharmacy,
  AccountBalanceWallet,
  AdminPanelSettings,
  Close,
} from "@mui/icons-material";
import adminApi from "../../api/admin";
import branchApi from "../../api/branch";
import apiClient from "../../api/client";

const ROLE_TABS = [
  { label: "All Roles", value: "" },
  { label: "Doctors", value: "doctor", icon: <LocalHospital fontSize="small" /> },
  { label: "Patients", value: "patient", icon: <People fontSize="small" /> },
  { label: "Lab Technicians", value: "lab_technician", icon: <Biotech fontSize="small" /> },
  { label: "Pharmacists", value: "pharmacist", icon: <LocalPharmacy fontSize="small" /> },
  { label: "Billing Officers", value: "billing_officer", icon: <AccountBalanceWallet fontSize="small" /> },
  { label: "Admins", value: "admin", icon: <AdminPanelSettings fontSize="small" /> },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalUsers, setTotalUsers] = useState(0);

  // Reference data for creation dialog
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);

  // Create Modal State
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "doctor",
    status: "active",
    // Doctor
    branch_id: "",
    department_id: "",
    specialty_id: "",
    consultation_fee: 10000,
    consultation_room: "Suite 101",
    license_number: "",
    // Patient
    national_id: "",
    gender: "male",
    dob: "1995-01-01",
    address: "Kigali, Rwanda",
    insurance_provider_id: "",
    insurance_number: "",
  });

  // User Details Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedStatus, page, rowsPerPage]);

  const fetchReferenceData = async () => {
    try {
      const [branchRes, deptRes, specRes, insRes] = await Promise.all([
        branchApi.getBranches(),
        branchApi.getDepartments(),
        branchApi.getSpecialties(),
        apiClient.get("/insurance-providers"),
      ]);

      const bList = branchRes.data || [];
      const dList = deptRes.data || [];
      const sList = specRes.data || [];
      const iList = insRes.data?.data || insRes.data || [];

      setBranches(bList);
      setDepartments(dList);
      setSpecialties(sList);
      setInsuranceProviders(iList);

      if (bList.length > 0) setFormData((prev) => ({ ...prev, branch_id: bList[0].id }));
      if (dList.length > 0) setFormData((prev) => ({ ...prev, department_id: dList[0].id }));
      if (sList.length > 0) setFormData((prev) => ({ ...prev, specialty_id: sList[0].id }));
      if (iList.length > 0) setFormData((prev) => ({ ...prev, insurance_provider_id: iList[0].id }));
    } catch (err) {
      console.error("Failed to load reference data:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminApi.getUsers(params);
      setUsers(res.data || []);
      setTotalUsers(res.meta?.total || (res.data || []).length);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Unable to retrieve user registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleToggleStatus = async (user, newStatus) => {
    try {
      await adminApi.toggleUserStatus(user.id, newStatus);
      setSuccessMsg(`User ${user.name} is now ${newStatus}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error("Status toggle failed:", err);
      setError("Failed to update user status.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        status: formData.status,
      };

      if (formData.role === "doctor") {
        payload.branch_id = formData.branch_id;
        payload.department_id = formData.department_id;
        payload.specialty_id = formData.specialty_id;
        payload.consultation_fee = formData.consultation_fee;
        payload.consultation_room = formData.consultation_room;
        payload.license_number = formData.license_number || `RMD-${Date.now().toString().slice(-4)}`;
      } else if (formData.role === "patient") {
        payload.national_id = formData.national_id;
        payload.gender = formData.gender;
        payload.dob = formData.dob;
        payload.address = formData.address;
        payload.insurance_provider_id = formData.insurance_provider_id;
        payload.insurance_number = formData.insurance_number;
      }

      await adminApi.createUser(payload);
      setSuccessMsg(`Account for ${formData.name} (${formData.role}) provisioned successfully.`);
      setOpenCreateModal(false);
      fetchUsers();
    } catch (err) {
      console.error("User creation failed:", err);
      setError(err.response?.data?.message || "Failed to create user. Verify form inputs.");
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: { label: "Administrator", color: "#9333EA", bg: "#FAF5FF" },
      doctor: { label: "Physician", color: "#0D9488", bg: "#F0FDFA" },
      patient: { label: "Patient", color: "#2563EB", bg: "#EFF6FF" },
      lab_technician: { label: "Lab Tech", color: "#EA580C", bg: "#FFF7ED" },
      pharmacist: { label: "Pharmacist", color: "#16A34A", bg: "#F0FDF4" },
      billing_officer: { label: "Billing Officer", color: "#0891B2", bg: "#ECFEFF" },
    };
    const conf = map[role] || { label: role, color: "#64748B", bg: "#F8FAFC" };
    return (
      <Chip
        label={conf.label}
        size="small"
        sx={{ bgcolor: conf.bg, color: conf.color, fontWeight: 700, fontSize: "0.72rem" }}
      />
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { label: "Active", bg: "#DCFCE7", color: "#166534" },
      inactive: { label: "Inactive", bg: "#F1F5F9", color: "#475569" },
      suspended: { label: "Suspended", bg: "#FEE2E2", color: "#991B1B" },
    };
    const conf = map[status] || { label: status, bg: "#F1F5F9", color: "#475569" };
    return (
      <Chip
        label={conf.label}
        size="small"
        sx={{ bgcolor: conf.bg, color: conf.color, fontWeight: 700, fontSize: "0.72rem" }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={7}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Staff & Patient Management Console
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Centralized identity governance, role provisioning, and account status administration.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setOpenCreateModal(true)}
              sx={{ bgcolor: "#0D9488", "&:hover": { bgcolor: "#0F766E" }, fontWeight: 700 }}
            >
              Provision New Account
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Role Tabs */}
      <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, mb: 3 }}>
        <Tabs
          value={selectedRole}
          onChange={(_, val) => {
            setSelectedRole(val);
            setPage(0);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: "1px solid #E2E8F0",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 48 },
            "& .Mui-selected": { color: "#0D9488 !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#0D9488" },
          }}
        >
          {ROLE_TABS.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} icon={tab.icon} iconPosition="start" />
          ))}
        </Tabs>

        {/* Search & Filter Toolbar */}
        <Box sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, minWidth: 260 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name, email, or Rwandan phone number..."
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
          </Box>

          <TextField
            select
            size="small"
            label="Account Status"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>

          <Button variant="outlined" onClick={fetchUsers} sx={{ borderColor: "#CBD5E1", color: "#334155" }}>
            Refresh
          </Button>
        </Box>

        {/* User Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Contact Phone</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Affiliation / Details</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colspan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#0D9488" }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colspan={6} align="center" sx={{ py: 6, color: "#94A3B8" }}>
                    No users found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  let affiliation = "—";
                  if (u.role === "doctor" && u.doctor) {
                    affiliation = `${u.doctor.branch_name || "Branch"} • ${u.doctor.department_name || "Dept"}`;
                  } else if (u.role === "patient" && u.patient) {
                    affiliation = u.patient.insurance_provider_name
                      ? `${u.patient.insurance_provider_name} (${u.patient.national_id || "NIN"})`
                      : `Self-Pay (${u.patient.national_id || "NIN"})`;
                  }

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: "#0D9488", width: 34, height: 34, fontSize: "0.85rem", fontWeight: 700 }}>
                            {u.name?.charAt(0) || "U"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                              {u.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {u.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {affiliation}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusBadge(u.status)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Profile">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(u);
                                setOpenDetailsModal(true);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {u.status === "active" ? (
                            <Tooltip title="Suspend Account">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleToggleStatus(u, "suspended")}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Activate Account">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleToggleStatus(u, "active")}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Paper>

      {/* Provision Account Modal */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Provision New System Account
          </Typography>
          <IconButton onClick={() => setOpenCreateModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleCreateUser}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              {/* Account Role Selector */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="doctor">Physician (Doctor)</MenuItem>
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="lab_technician">Laboratory Technician</MenuItem>
                  <MenuItem value="pharmacist">Pharmacist</MenuItem>
                  <MenuItem value="billing_officer">Billing Officer</MenuItem>
                  <MenuItem value="admin">System Administrator</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Initial Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>

              {/* Core Demographics */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  placeholder="e.g. Dr. Jean Bosco Gasana"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Official Email"
                  placeholder="name@hospital.rw"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number (Rwanda)"
                  placeholder="+250 788 123 456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  helperText="Valid formats: +250788..., 0788..."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="password"
                  label="Initial Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  helperText="Minimum 8 characters"
                />
              </Grid>

              {/* Doctor Specific Form Fields */}
              {formData.role === "doctor" && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0D9488", mt: 1 }}>
                      Clinical Profile & Hospital Assignment
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Hospital Branch"
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    >
                      {branches.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.branch_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Department"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.department_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Specialty"
                      value={formData.specialty_id}
                      onChange={(e) => setFormData({ ...formData, specialty_id: e.target.value })}
                    >
                      {specialties.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.specialty_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Consultation Fee (RWF)"
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Consultation Room"
                      value={formData.consultation_room}
                      onChange={(e) => setFormData({ ...formData, consultation_room: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Medical License Number"
                      placeholder="e.g. RMD-2026-1044"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    />
                  </Grid>
                </>
              )}

              {/* Patient Specific Form Fields */}
              {formData.role === "patient" && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#2563EB", mt: 1 }}>
                      Patient Identity & Insurance Details
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="National Identification (NIN)"
                      placeholder="16 digits (e.g. 1199870023456781)"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      label="Gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      InputLabelProps={{ shrink: true }}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Insurance Provider"
                      value={formData.insurance_provider_id}
                      onChange={(e) => setFormData({ ...formData, insurance_provider_id: e.target.value })}
                    >
                      <MenuItem value="">None (Self-Pay 100%)</MenuItem>
                      {insuranceProviders.map((ins) => (
                        <MenuItem key={ins.id} value={ins.id}>
                          {ins.provider_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Insurance Policy / Card Number"
                      placeholder="e.g. RAMA-9928312"
                      value={formData.insurance_number}
                      onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenCreateModal(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating}
              sx={{ bgcolor: "#0D9488", "&:hover": { bgcolor: "#0F766E" }, fontWeight: 700 }}
            >
              {creating ? <CircularProgress size={20} color="inherit" /> : "Save & Provision Account"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={openDetailsModal} onClose={() => setOpenDetailsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            User Account Profile
          </Typography>
          <IconButton onClick={() => setOpenDetailsModal(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "#0D9488", fontSize: "1.25rem", fontWeight: 800 }}>
                  {selectedUser.name?.charAt(0) || "U"}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </Stack>
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Contact Phone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.phone || "Not recorded"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Registered At</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}
                  </Typography>
                </Grid>

                {selectedUser.role === "doctor" && selectedUser.doctor && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Branch</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.doctor.branch_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Department</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.doctor.department_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Consultation Fee</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{Number(selectedUser.doctor.consultation_fee).toLocaleString()} RWF</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Room / License</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedUser.doctor.consultation_room || "Room 101"} ({selectedUser.doctor.license_number || "Licensed"})
                      </Typography>
                    </Grid>
                  </>
                )}

                {selectedUser.role === "patient" && selectedUser.patient && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">National ID (NIN)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.patient.national_id || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Insurance Provider</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.patient.insurance_provider_name || "Self-Pay"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Insurance Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.patient.insurance_number || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.patient.dob || "—"}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
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

export default UserManagement;
