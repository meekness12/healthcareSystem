import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Box,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Favorite,
  Speed,
  DeviceThermostat,
  Air,
  FitnessCenter,
} from "@mui/icons-material";

const VitalsEntryCard = ({ vitals, onChange, readOnly = false }) => {
  const theme = useTheme();

  const handleFieldChange = (field, value) => {
    if (readOnly) return;
    onChange({
      ...vitals,
      [field]: value === "" ? null : Number(value),
    });
  };

  const isBPHigh =
    (vitals?.blood_pressure_systolic && vitals.blood_pressure_systolic >= 140) ||
    (vitals?.blood_pressure_diastolic && vitals.blood_pressure_diastolic >= 90);

  const isFever = vitals?.temperature && vitals.temperature >= 38.0;
  const isHypoxia = vitals?.spo2 && vitals.spo2 < 95;

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
            <Speed color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Vital Signs & Triage Observations
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isBPHigh && (
              <Chip label="High BP" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
            )}
            {isFever && (
              <Chip label="Febrile" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
            )}
            {isHypoxia && (
              <Chip label="Low SpO2" size="small" color="warning" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
            )}
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Blood Pressure Systolic & Diastolic */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="BP Systolic"
              type="number"
              size="small"
              fullWidth
              value={vitals?.blood_pressure_systolic ?? ""}
              onChange={(e) => handleFieldChange("blood_pressure_systolic", e.target.value)}
              disabled={readOnly}
              InputProps={{
                endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
              }}
              helperText="Normal: 90 - 120"
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="BP Diastolic"
              type="number"
              size="small"
              fullWidth
              value={vitals?.blood_pressure_diastolic ?? ""}
              onChange={(e) => handleFieldChange("blood_pressure_diastolic", e.target.value)}
              disabled={readOnly}
              InputProps={{
                endAdornment: <InputAdornment position="end">mmHg</InputAdornment>,
              }}
              helperText="Normal: 60 - 80"
            />
          </Grid>

          {/* Heart Rate */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="Heart Rate"
              type="number"
              size="small"
              fullWidth
              value={vitals?.heart_rate ?? ""}
              onChange={(e) => handleFieldChange("heart_rate", e.target.value)}
              disabled={readOnly}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Favorite color="error" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
              }}
              helperText="Normal: 60 - 100"
            />
          </Grid>

          {/* Temperature */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="Temperature"
              type="number"
              size="small"
              fullWidth
              inputProps={{ step: "0.1" }}
              value={vitals?.temperature ?? ""}
              onChange={(e) => handleFieldChange("temperature", e.target.value)}
              disabled={readOnly}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DeviceThermostat color="warning" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">°C</InputAdornment>,
              }}
              helperText="Normal: 36.5 - 37.5"
            />
          </Grid>

          {/* Oxygen Saturation SpO2 */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="SpO2 Saturation"
              type="number"
              size="small"
              fullWidth
              value={vitals?.spo2 ?? ""}
              onChange={(e) => handleFieldChange("spo2", e.target.value)}
              disabled={readOnly}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Air color="info" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText="Normal: 95 - 100"
            />
          </Grid>

          {/* Patient Weight */}
          <Grid item xs={6} sm={4}>
            <TextField
              label="Weight"
              type="number"
              size="small"
              fullWidth
              inputProps={{ step: "0.5" }}
              value={vitals?.weight_kg ?? ""}
              onChange={(e) => handleFieldChange("weight_kg", e.target.value)}
              disabled={readOnly}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FitnessCenter color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              }}
              helperText="Dosage reference"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default VitalsEntryCard;
