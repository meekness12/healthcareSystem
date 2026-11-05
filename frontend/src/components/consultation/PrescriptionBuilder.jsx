import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Divider,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Medication,
  Add,
  DeleteOutline,
  HelpOutline,
  ReceiptLong,
  InfoOutlined,
} from "@mui/icons-material";
import medicineApi from "../../api/medicine";

const FREQUENCY_OPTIONS = [
  { value: "Once daily (OD)", multiplier: 1, label: "Once daily (OD) - Every 24h" },
  { value: "Twice daily (BID)", multiplier: 2, label: "Twice daily (BID) - Every 12h" },
  { value: "Three times daily (TID)", multiplier: 3, label: "Three times daily (TID) - Every 8h" },
  { value: "Four times daily (QID)", multiplier: 4, label: "Four times daily (QID) - Every 6h" },
  { value: "As needed (PRN)", multiplier: 1, label: "As needed (PRN) - Symptomatic" },
  { value: "At bedtime (QHS)", multiplier: 1, label: "At bedtime (QHS) - Nightly" },
];

const PrescriptionBuilder = ({
  prescriptionItems,
  onChange,
  generalInstructions,
  onInstructionsChange,
  patientInsurance = null,
}) => {
  const theme = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoadingMedicines(true);
        const res = await medicineApi.getMedicines({ in_stock_only: false });
        if (res.success && res.data) {
          setMedicines(res.data);
        }
      } catch (err) {
        console.error("Failed to load medicine catalogue:", err);
      } finally {
        setLoadingMedicines(false);
      }
    };
    fetchMedicines();
  }, []);

  const handleAddItem = () => {
    onChange([
      ...prescriptionItems,
      {
        medicine: null,
        medicine_id: "",
        dosage: "1 tablet",
        frequency: "Three times daily (TID)",
        duration_days: 5,
        quantity_prescribed: 15,
        instructions: "Take with or after meals",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const updated = prescriptionItems.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    const current = { ...updated[index], [field]: value };

    // Auto-calculate quantity when frequency or duration changes
    if (field === "frequency" || field === "duration_days") {
      const freqObj = FREQUENCY_OPTIONS.find((f) => f.value === (field === "frequency" ? value : current.frequency));
      const mult = freqObj ? freqObj.multiplier : 1;
      const days = field === "duration_days" ? Number(value) || 1 : Number(current.duration_days) || 1;
      current.quantity_prescribed = Math.max(1, mult * days);
    }

    if (field === "medicine") {
      current.medicine = value;
      current.medicine_id = value ? value.id : "";
      if (value && value.dosage_form) {
        current.dosage = value.dosage_form === "syrup" ? "10ml" : "1 " + value.dosage_form;
      }
    }

    updated[index] = current;
    onChange(updated);
  };

  // Financial calculations
  const totalCostRwf = prescriptionItems.reduce((acc, item) => {
    const price = Number(item.medicine?.unit_price_rwf ?? 0);
    const qty = Number(item.quantity_prescribed ?? 0);
    return acc + price * qty;
  }, 0);

  const coveragePercent = Number(patientInsurance?.coverage_percentage ?? 0);
  const insuranceCoveredRwf = Math.round(totalCostRwf * (coveragePercent / 100));
  const patientCopayRwf = Math.max(0, totalCostRwf - insuranceCoveredRwf);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2.5,
        bgcolor: "background.paper",
        mb: 2.5,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Medication color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Electronic Prescription Builder (Rx)
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={handleAddItem}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Add Medication
          </Button>
        </Box>

        {prescriptionItems.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No medications prescribed yet. Click "Add Medication" above to prescribe from Rwanda's essential medicine catalogue.
            </Typography>
          </Box>
        ) : (
          <Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Medication</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "130px" }}>Dosage</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "200px" }}>Frequency</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "100px" }}>Days</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "90px" }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Instructions</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "50px" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptionItems.map((item, index) => (
                    <TableRow key={index}>
                      {/* Medicine Autocomplete */}
                      <TableCell sx={{ minWidth: 220 }}>
                        <Autocomplete
                          size="small"
                          options={medicines}
                          loading={loadingMedicines}
                          value={item.medicine}
                          onChange={(_, val) => handleItemChange(index, "medicine", val)}
                          getOptionLabel={(option) =>
                            `${option.medicine_name} (${option.strength || option.dosage_form})`
                          }
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Search medicine..."
                              variant="outlined"
                              size="small"
                              required
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {option.medicine_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.category} • {option.dosage_form} • {Number(option.unit_price_rwf).toLocaleString()} RWF
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        />
                      </TableCell>

                      {/* Dosage */}
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.dosage}
                          onChange={(e) => handleItemChange(index, "dosage", e.target.value)}
                          placeholder="e.g. 500mg"
                        />
                      </TableCell>

                      {/* Frequency */}
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={item.frequency}
                          onChange={(e) => handleItemChange(index, "frequency", e.target.value)}
                        >
                          {FREQUENCY_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.85rem" }}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      {/* Duration Days */}
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          inputProps={{ min: 1, max: 90 }}
                          value={item.duration_days}
                          onChange={(e) => handleItemChange(index, "duration_days", e.target.value)}
                        />
                      </TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          inputProps={{ min: 1 }}
                          value={item.quantity_prescribed}
                          onChange={(e) => handleItemChange(index, "quantity_prescribed", e.target.value)}
                        />
                      </TableCell>

                      {/* Instructions */}
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.instructions}
                          onChange={(e) => handleItemChange(index, "instructions", e.target.value)}
                          placeholder="e.g. Take after meals"
                        />
                      </TableCell>

                      {/* Remove Button */}
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* General Administration Instructions */}
            <TextField
              label="General Prescription Notes / Dietary Warnings"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={generalInstructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              placeholder="e.g. Complete the entire course of antibiotics. Avoid alcohol and dairy within 2 hours of ingestion."
              sx={{ mb: 2 }}
            />

            {/* Live Financial & Insurance Co-Pay Estimation */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === "dark" ? "rgba(25, 118, 210, 0.1)" : "primary.lighter",
                border: `1px solid ${theme.palette.primary.light}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ReceiptLong color="primary" />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Estimated Pharmacy Cost: {totalCostRwf.toLocaleString()} RWF
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {patientInsurance?.provider_name
                      ? `${patientInsurance.provider_name} covers ${coveragePercent}%`
                      : "Direct patient payment (No insurance)"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                {coveragePercent > 0 && (
                  <Chip
                    label={`Insurance: ${insuranceCoveredRwf.toLocaleString()} RWF`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                <Chip
                  label={`Patient Co-Pay: ${patientCopayRwf.toLocaleString()} RWF`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PrescriptionBuilder;
