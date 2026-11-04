import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  useTheme,
  Avatar,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Search,
  LocalHospital,
  LocationOn,
  MedicalServices,
  AccessTime,
  Close,
  AttachMoney,
  EventAvailable,
  Badge,
} from "@mui/icons-material";
import { useSearchParams, useNavigate } from "react-router-dom";
import doctorApi from "../../api/doctor";
import branchApi from "../../api/branch";
import TimeSlotPicker from "../../components/booking/TimeSlotPicker";

const DoctorDirectory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get("branch_id") || "");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Slot Preview Dialog State
  const [previewDoctor, setPreviewDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load branches & specialties on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [branchRes, specRes] = await Promise.all([
          branchApi.getBranches(),
          branchApi.getSpecialties(),
        ]);
        if (branchRes?.data) setBranches(branchRes.data);
        if (specRes?.data) setSpecialties(specRes.data);
      } catch (err) {
        console.error("Failed to load filter metadata:", err);
      }
    };
    loadFilters();
  }, []);

  // Fetch doctors whenever filters change
  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedBranch) params.branch_id = selectedBranch;
        if (selectedSpecialty) params.specialty_id = selectedSpecialty;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await doctorApi.getDoctors(params);
        if (isMounted && res?.data) {
          setDoctors(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchDoctors, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedBranch, selectedSpecialty, searchQuery]);

  const handleBranchChange = (e) => {
    const val = e.target.value;
    setSelectedBranch(val);
    if (val) {
      setSearchParams({ branch_id: val });
    } else {
      setSearchParams({});
    }
  };

  const handleOpenSlotPreview = (doctor) => {
    setPreviewDoctor(doctor);
    setSelectedSlot(null);
  };

  const handleCloseSlotPreview = () => {
    setPreviewDoctor(null);
    setSelectedSlot(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Specialist & Consultant Doctors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find accredited medical specialists, check real-time consultation schedules, and book clinical appointments across Rwanda.
        </Typography>
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search doctor by name or license number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              size="small"
              fullWidth
              label="Filter by Hospital Branch"
              value={selectedBranch}
              onChange={handleBranchChange}
            >
              <MenuItem value="">
                <em>All Hospital Branches</em>
              </MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.branch_name} ({b.province})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              size="small"
              fullWidth
              label="Filter by Specialty"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <MenuItem value="">
                <em>All Medical Specialties</em>
              </MenuItem>
              {specialties.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.specialty_name} ({s.doctors_count || 0})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Doctors Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : doctors.length === 0 ? (
        <Box textAlign="center" py={8}>
          <LocalHospital sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No doctors found matching your filter criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {doctors.map((doctor) => (
            <Grid item xs={12} sm={6} lg={4} key={doctor.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 12px 28px rgba(0,0,0,0.5)"
                        : "0 12px 28px rgba(13, 148, 136, 0.12)",
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  {/* Top Doctor Avatar & Specialty Badge */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Avatar
                      src={doctor.avatar_url || undefined}
                      alt={doctor.name}
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "primary.main",
                        fontWeight: 700,
                        fontSize: "1.4rem",
                      }}
                    >
                      {doctor.name?.charAt(0)}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Chip
                          label={doctor.specialty_name || "General"}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 700, fontSize: "0.75rem", mb: 0.5 }}
                        />
                        <Chip
                          label={doctor.status === "on_leave" ? "ON LEAVE" : "ACTIVE"}
                          size="small"
                          color={doctor.status === "on_leave" ? "warning" : "success"}
                          variant="outlined"
                          sx={{ fontSize: "0.65rem", fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {doctor.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lic: {doctor.license_number}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Branch & Consultation Room */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {doctor.branch_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalHospital fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {doctor.department_name} • {doctor.consultation_room}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Consultation Fee Badge */}
                  <Box
                    sx={{
                      p: 1.5,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(13, 148, 136, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                      CONSULTATION TARIFF
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>
                      {Number(doctor.consultation_fee).toLocaleString()} RWF
                    </Typography>
                  </Box>

                  {/* Consulting Active Days */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.8, fontWeight: 600 }}>
                      CLINIC SCHEDULE
                    </Typography>
                    <Stack direction="row" spacing={0.6} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => {
                        const isWorking = doctor.active_days?.includes(day);
                        return (
                          <Chip
                            key={day}
                            label={day.slice(0, 3).toUpperCase()}
                            size="small"
                            color={isWorking ? "primary" : "default"}
                            variant={isWorking ? "filled" : "outlined"}
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              opacity: isWorking ? 1 : 0.4,
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<EventAvailable />}
                    disabled={doctor.status === "on_leave"}
                    onClick={() => handleOpenSlotPreview(doctor)}
                    sx={{ fontWeight: 700 }}
                  >
                    {doctor.status === "on_leave" ? "Doctor On Leave" : "Check Available Slots"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Available Slots Preview Dialog */}
      <Dialog
        open={Boolean(previewDoctor)}
        onClose={handleCloseSlotPreview}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {previewDoctor?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {previewDoctor?.specialty_name} • {previewDoctor?.branch_name}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseSlotPreview} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {previewDoctor && (
            <TimeSlotPicker
              doctorId={previewDoctor.id}
              doctorName={previewDoctor.name}
              consultationFee={previewDoctor.consultation_fee}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
            />
          )}

          {selectedSlot && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(20, 184, 166, 0.15)"
                    : "rgba(13, 148, 136, 0.08)",
                border: `1px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>
                Selected Appointment Time:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Date: {selectedSlot.date} | Session: {selectedSlot.start_time} - {selectedSlot.end_time}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSlotPreview} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            disabled={!selectedSlot}
            onClick={() => {
              handleCloseSlotPreview();
              navigate(`/patient/book-appointment?doctor_id=${previewDoctor?.id}&date=${selectedSlot?.date}&start_time=${selectedSlot?.start_time}`);
            }}
            sx={{ fontWeight: 700 }}
          >
            Proceed to Appointment Intake
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DoctorDirectory;
