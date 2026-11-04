import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  PhotoCamera,
  Person,
  Lock,
  HealthAndSafety,
  CheckCircle,
  LocalHospital,
  Badge,
  Phone,
  Email,
  Home,
  ContactPhone,
  MedicalServices,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import authApi from "../../api/auth";

const ProfileSettings = () => {
  const theme = useTheme();
  const { user, updateProfile, changePassword, uploadAvatar, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef(null);
  const [insuranceProviders, setInsuranceProviders] = useState([]);

  // Demographics form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.patient?.address || "",
    emergency_contact_name: user?.patient?.emergency_contact_name || "",
    emergency_contact_phone: user?.patient?.emergency_contact_phone || "",
    insurance_provider_id: user?.patient?.insurance_provider_id || "",
    insurance_number: user?.patient?.insurance_number || "",
    allergies: user?.patient?.allergies || "",
    medical_history: user?.patient?.medical_history || "",
    // Doctor fields
    consultation_room: user?.doctor?.consultation_room || "",
    consultation_fee: user?.doctor?.consultation_fee || "",
    bio: user?.doctor?.bio || "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.patient?.address || "",
        emergency_contact_name: user.patient?.emergency_contact_name || "",
        emergency_contact_phone: user.patient?.emergency_contact_phone || "",
        insurance_provider_id: user.patient?.insurance_provider_id || "",
        insurance_number: user.patient?.insurance_number || "",
        allergies: user.patient?.allergies || "",
        medical_history: user.patient?.medical_history || "",
        consultation_room: user.doctor?.consultation_room || "",
        consultation_fee: user.doctor?.consultation_fee || "",
        bio: user.doctor?.bio || "",
      });
    }
  }, [user]);

  // Load insurance schemes
  useEffect(() => {
    let isMounted = true;
    const loadInsurance = async () => {
      try {
        const res = await authApi.getInsuranceProviders();
        if (isMounted && res?.data) {
          setInsuranceProviders(res.data);
        }
      } catch (e) {
        console.warn("Could not load insurance list:", e);
      }
    };
    loadInsurance();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Avatar upload with 2MB validation
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setErrorMessage("Only JPG and PNG image files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Profile picture cannot exceed 2 Megabytes (2MB).");
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage("");
    try {
      await uploadAvatar(file);
      setSuccessMessage("Profile photograph updated successfully!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setErrorMessage(err.response?.data?.message || "Failed to upload photograph.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        ...profileForm,
        insurance_provider_id: profileForm.insurance_provider_id ? Number(profileForm.insurance_provider_id) : null,
      };
      await updateProfile(payload);
      setSuccessMessage("Profile information saved successfully!");
    } catch (err) {
      console.error("Profile save error:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to save profile changes."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Password save
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await changePassword(passwordForm);
      setSuccessMessage("Your password has been securely updated.");
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      console.error("Password update error:", err);
      const msg =
        err.response?.data?.errors?.current_password?.[0] ||
        err.response?.data?.errors?.new_password?.[0] ||
        err.response?.data?.message ||
        "Failed to update password.";
      setErrorMessage(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Top Profile Summary Header */}
      <Card sx={{ mb: 4, overflow: "hidden", borderRadius: 3 }}>
        <Box
          sx={{
            height: 100,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(90deg, #042f2e 0%, #134e4a 100%)"
                : "linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)",
          }}
        />
        <CardContent sx={{ pt: 0, pb: 3, position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "center", sm: "flex-end" },
              gap: 3,
              mt: -6,
              mb: 2,
            }}
          >
            {/* Avatar with Camera Trigger */}
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={user.avatar_url || undefined}
                alt={user.name}
                sx={{
                  width: 100,
                  height: 100,
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: 3,
                  bgcolor: "primary.main",
                  fontSize: "2.2rem",
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleAvatarSelect}
              />
              <Tooltip title="Upload Photo (Max 2MB JPEG/PNG)">
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { bgcolor: "primary.dark" },
                    boxShadow: 2,
                  }}
                  size="small"
                >
                  {uploadingAvatar ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* Identity details */}
            <Box sx={{ textAlign: { xs: "center", sm: "left" }, flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email} • {user.phone}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: { xs: "center", sm: "flex-start" } }}>
                <Chip
                  label={user.role?.toUpperCase()}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700, letterSpacing: "0.05em" }}
                />
                <Chip
                  label={user.status?.toUpperCase()}
                  color={user.status === "active" ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
                {user.patient?.patient_number && (
                  <Chip
                    label={`ID: ${user.patient.patient_number}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: "monospace" }}
                  />
                )}
                {user.doctor?.branch_name && (
                  <Chip
                    label={`Branch: ${user.doctor.branch_name}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {/* Main Settings Card */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newVal) => setActiveTab(newVal)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Demographics" />
            {user.role === "patient" && (
              <Tab icon={<HealthAndSafety fontSize="small" />} iconPosition="start" label="Insurance & Health" />
            )}
            {user.role === "doctor" && (
              <Tab icon={<MedicalServices fontSize="small" />} iconPosition="start" label="Clinical Practice" />
            )}
            <Tab icon={<Lock fontSize="small" />} iconPosition="start" label="Security & Password" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* TAB 0: Demographics */}
          {activeTab === 0 && (
            <Box component="form" onSubmit={handleProfileSubmit}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Contact & Residential Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Keep your Rwandan national contact details up to date for SMS appointment reminders.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={user.email}
                    disabled
                    helperText="Official login email (contact administrator to update)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    helperText="Rwandan mobile format (e.g. +250788123456)"
                    required
                  />
                </Grid>

                {user.role === "patient" && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Rwandan National ID (NID)"
                        value={user.patient?.national_id || "Not Recorded"}
                        disabled
                        helperText="16-digit primary identifier"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Residential Address"
                        name="address"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        helperText="District, Sector, Cell, Village"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Emergency Contact Person"
                        name="emergency_contact_name"
                        value={profileForm.emergency_contact_name}
                        onChange={handleProfileChange}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Emergency Contact Phone"
                        name="emergency_contact_phone"
                        value={profileForm.emergency_contact_phone}
                        onChange={handleProfileChange}
                        helperText="e.g. +250788998877"
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingProfile}
                  sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {savingProfile ? <CircularProgress size={22} color="inherit" /> : "Save Changes"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 1 (Patient): Insurance & Health */}
          {activeTab === 1 && user.role === "patient" && (
            <Box component="form" onSubmit={handleProfileSubmit}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Rwandan Health Insurance & Allergies
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your active health insurance card for automatic hospital tariff discounts.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Insurance Scheme"
                    name="insurance_provider_id"
                    value={profileForm.insurance_provider_id}
                    onChange={handleProfileChange}
                  >
                    <MenuItem value="">
                      <em>Self-Pay / None</em>
                    </MenuItem>
                    {insuranceProviders.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.provider_name} ({p.coverage_percentage}% Coverage)
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Insurance Card / Policy Number"
                    name="insurance_number"
                    value={profileForm.insurance_number}
                    onChange={handleProfileChange}
                    helperText="e.g. RSSB-2026-98765"
                    disabled={!profileForm.insurance_provider_id}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Known Drug Allergies & Adverse Reactions"
                    name="allergies"
                    value={profileForm.allergies}
                    onChange={handleProfileChange}
                    placeholder="e.g., Penicillin, Sulfonamides, NSAIDs"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Chronic Medical History"
                    name="medical_history"
                    value={profileForm.medical_history}
                    onChange={handleProfileChange}
                    placeholder="e.g., Hypertension diagnosed 2022, Type 2 Diabetes"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingProfile}
                  sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {savingProfile ? <CircularProgress size={22} color="inherit" /> : "Save Medical Info"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 1 (Doctor): Clinical Practice */}
          {activeTab === 1 && user.role === "doctor" && (
            <Box component="form" onSubmit={handleProfileSubmit}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Clinical Practice & Department Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Hospital branch affiliation and consultation parameters.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hospital Branch"
                    value={user.doctor?.branch_name || "Unassigned"}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Clinical Department"
                    value={user.doctor?.department_name || "Unassigned"}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Specialty"
                    value={user.doctor?.specialty_name || "General"}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Medical License Number"
                    value={user.doctor?.license_number || "Not Recorded"}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Consultation Room / Ward"
                    name="consultation_room"
                    value={profileForm.consultation_room}
                    onChange={handleProfileChange}
                    helperText="e.g., Room 204, OPD Block B"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Consultation Fee (RWF)"
                    name="consultation_fee"
                    type="number"
                    value={profileForm.consultation_fee}
                    onChange={handleProfileChange}
                    helperText="Base fee before insurance discount"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Professional Bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    placeholder="Short summary of medical expertise and background..."
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingProfile}
                  sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {savingProfile ? <CircularProgress size={22} color="inherit" /> : "Save Doctor Profile"}
                </Button>
              </Box>
            </Box>
          )}

          {/* Security & Password Tab */}
          {((user.role === "patient" && activeTab === 2) ||
            (user.role === "doctor" && activeTab === 2) ||
            (user.role !== "patient" && user.role !== "doctor" && activeTab === 1)) && (
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ensure your hospital portal account uses a strong passphrase with numbers and special symbols.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    helperText="Min 8 characters with uppercase, number and symbol"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    name="new_password_confirmation"
                    value={passwordForm.new_password_confirmation}
                    onChange={handlePasswordChange}
                    helperText="Retype new password"
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={savingPassword}
                  sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {savingPassword ? <CircularProgress size={22} color="inherit" /> : "Update Password"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProfileSettings;
