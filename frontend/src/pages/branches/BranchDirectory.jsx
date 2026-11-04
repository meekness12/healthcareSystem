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
  Divider,
} from "@mui/material";
import {
  Search,
  LocalHospital,
  LocationOn,
  Phone,
  Email,
  MedicalServices,
  People,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import branchApi from "../../api/branch";

const PROVINCES = [
  "All Provinces",
  "Kigali City",
  "Western Province",
  "Northern Province",
  "Southern Province",
  "Eastern Province",
];

const BranchDirectory = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedProvince !== "All Provinces") {
          params.province = selectedProvince;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        const res = await branchApi.getBranches(params);
        if (isMounted && res?.data) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error("Failed to load hospital branches:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchBranches, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedProvince, searchQuery]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
          Hospital Network & Branches
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Integrated clinical centers across Rwanda's 5 provinces offering unified outpatient, surgical, and emergency care.
        </Typography>
      </Box>

      {/* Filters & Search Toolbar */}
      <Box
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 3,
          bgcolor: "background.paper",
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
        }}
      >
        {/* Province Chips */}
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: { xs: 1, md: 0 } }}>
          {PROVINCES.map((prov) => (
            <Chip
              key={prov}
              label={prov}
              clickable
              color={selectedProvince === prov ? "primary" : "default"}
              variant={selectedProvince === prov ? "filled" : "outlined"}
              onClick={() => setSelectedProvince(prov)}
              sx={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}
            />
          ))}
        </Stack>

        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search by hospital name or district..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { md: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Branch Cards Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : branches.length === 0 ? (
        <Box textAlign="center" py={8}>
          <LocalHospital sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hospital branches found matching your search.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {branches.map((branch) => (
            <Grid item xs={12} md={6} lg={4} key={branch.id}>
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
                  {/* Top Badge & Branch Name */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Chip
                      label={branch.province}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                    />
                    <Chip
                      label={branch.status?.toUpperCase()}
                      size="small"
                      color={branch.status === "active" ? "success" : "default"}
                      sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                    {branch.branch_name}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mb: 2 }}>
                    <LocationOn fontSize="small" sx={{ color: "primary.main" }} />
                    <Typography variant="body2">
                      {branch.district} • {branch.location} ({branch.address})
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Contact Info */}
                  <Stack spacing={1} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {branch.contact_phone || "Emergency Desk Available"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {branch.contact_email || "contact@hospital.rw"}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Metrics Badges */}
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <MedicalServices fontSize="small" color="primary" />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {branch.departments_count} Departments
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <People fontSize="small" color="secondary" />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {branch.doctors_count} Active Doctors
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(`/doctors?branch_id=${branch.id}`)}
                    sx={{ fontWeight: 700 }}
                  >
                    View Doctors in this Branch
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default BranchDirectory;
