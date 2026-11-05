import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  LocalHospital,
  Print,
  Close,
  Medication,
  CheckCircle,
  QrCode2,
} from "@mui/icons-material";

const PrescriptionVoucherModal = ({ open, onClose, prescription }) => {
  const theme = useTheme();

  if (!prescription) return null;

  const doctor = prescription.doctor || {};
  const patient = prescription.patient || {};
  const items = prescription.items || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          "@media print": {
            boxShadow: "none",
            p: 0,
            m: 0,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <LocalHospital color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              REPUBLIC OF RWANDA • MINISTRY OF HEALTH
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Official Electronic Medical Prescription • Karongi Hospital Network
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ "@media print": { display: "none" } }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Prescription Header Info */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
            border: `1px solid ${theme.palette.divider}`,
            mb: 2.5,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                PRESCRIPTION REF NUMBER
              </Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                {prescription.prescription_number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Date Issued: {prescription.prescription_date}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { sm: "right" } }}>
              <Chip
                label={prescription.status?.toUpperCase()}
                color={
                  prescription.status === "dispensed"
                    ? "success"
                    : prescription.status === "issued"
                    ? "primary"
                    : "default"
                }
                sx={{ fontWeight: 700 }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Doctor and Patient Grid */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Clinician Details */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, height: "100%" }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                Attending Prescribing Clinician
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Dr. {doctor.name || "N/A"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Specialty: {doctor.specialty || "General Medicine"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Medical License: {doctor.license_number || "RMD-VERIFIED"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Contact: {doctor.phone || "+250 788 000 000"}
              </Typography>
            </Box>
          </Grid>

          {/* Patient Details */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, height: "100%" }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                Patient Demographic & Insurance
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {patient.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Patient Record: #{patient.patient_number || "PT-N/A"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Gender: {patient.gender} • DOB: {patient.dob}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Insurance: {patient.insurance_provider ? `${patient.insurance_provider} (${patient.insurance_number})` : "Direct Self Pay"}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Itemized Medications Table */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Medication color="primary" fontSize="small" />
          Rx Prescribed Medications ({items.length})
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2.5 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Medicine & Strength</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dosage Form</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Days</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Instructions (Sig)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {item.medicine_name}
                    {item.strength && ` (${item.strength})`}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.dosage_form || "Tablet"}</TableCell>
                  <TableCell>{item.frequency}</TableCell>
                  <TableCell>{item.duration_days} days</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{item.quantity_prescribed}</TableCell>
                  <TableCell>{item.instructions || "Take as directed"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* General Instructions */}
        {prescription.instructions && (
          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              SPECIAL PHARMACY & DIETARY INSTRUCTIONS:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {prescription.instructions}
            </Typography>
          </Box>
        )}

        {/* Doctor Signature & Stamp Area (Print Only) */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <QrCode2 sx={{ fontSize: 44, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  Ministry of Health Digital Verification Code
                  <br />
                  Valid for hospital pharmacy dispensing
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 4 }}>
                Doctor's Stamp & Signature:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Dr. {doctor.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rwanda Medical and Dental Council License: {doctor.license_number}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, "@media print": { display: "none" } }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Print Official Prescription
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionVoucherModal;
