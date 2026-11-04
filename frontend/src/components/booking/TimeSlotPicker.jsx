import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import {
  CalendarMonth,
  AccessTime,
  CheckCircle,
  EventBusy,
  WbSunny,
  NightlightRound,
} from "@mui/icons-material";
import doctorApi from "../../api/doctor";

const TimeSlotPicker = ({ doctorId, doctorName, consultationFee, onSelectSlot, selectedSlot }) => {
  const theme = useTheme();

  // Default to tomorrow or today
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId || !selectedDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await doctorApi.getAvailableSlots(doctorId, selectedDate);
        if (isMounted) {
          setAvailability(res);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching available slots:", err);
          setError(
            err.response?.data?.errors?.date?.[0] ||
            err.response?.data?.message ||
            "Unable to calculate doctor appointment slots."
          );
          setAvailability(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [doctorId, selectedDate]);

  const handleSlotClick = (slot) => {
    if (!slot.is_available) return;
    if (onSelectSlot) {
      onSelectSlot({
        date: selectedDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        doctor_id: doctorId,
        consultation_fee: availability?.consultation_fee || consultationFee || 0,
      });
    }
  };

  const morningSlots = availability?.slots?.filter((s) => s.start_time < "12:00") || [];
  const afternoonSlots = availability?.slots?.filter((s) => s.start_time >= "12:00") || [];

  return (
    <Box sx={{ width: "100%" }}>
      {/* Date Selection Control */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarMonth fontSize="small" color="primary" /> Select Consultation Date
        </Typography>
        <TextField
          type="date"
          size="small"
          fullWidth
          value={selectedDate}
          inputProps={{
            min: todayStr,
          }}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </Box>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={1.5}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Calculating appointment availability...
          </Typography>
        </Box>
      )}

      {/* Error / Non-working State */}
      {error && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {availability && !loading && (
        <Box>
          {/* Day & Leave Banner */}
          {!availability.is_working_day ? (
            <Alert severity="info" icon={<EventBusy />} sx={{ mb: 2 }}>
              {availability.message || "Doctor does not conduct consultations on this date."}
            </Alert>
          ) : (
            <>
              {/* Availability metrics badge */}
              <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  label={`${availability.day_of_week?.toUpperCase()}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`${availability.available_slots_count} of ${availability.total_slots} Slots Available`}
                  size="small"
                  color={availability.available_slots_count > 0 ? "success" : "error"}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                {availability.consultation_fee && (
                  <Chip
                    label={`Fee: ${Number(availability.consultation_fee).toLocaleString()} RWF`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>

              {/* Morning Slots */}
              {morningSlots.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
                    <WbSunny fontSize="inherit" sx={{ color: "#f59e0b" }} /> MORNING SESSIONS (08:00 – 12:00)
                  </Typography>
                  <Grid container spacing={1}>
                    {morningSlots.map((slot) => {
                      const isSelected =
                        selectedSlot &&
                        selectedSlot.date === selectedDate &&
                        selectedSlot.start_time === slot.start_time;

                      return (
                        <Grid item xs={6} sm={4} key={slot.start_time}>
                          <Chip
                            label={`${slot.start_time} - ${slot.end_time}`}
                            clickable={slot.is_available}
                            onClick={() => handleSlotClick(slot)}
                            color={isSelected ? "primary" : slot.is_available ? "default" : "default"}
                            variant={isSelected ? "filled" : "outlined"}
                            disabled={!slot.is_available}
                            icon={isSelected ? <CheckCircle fontSize="small" /> : undefined}
                            sx={{
                              width: "100%",
                              fontWeight: isSelected ? 700 : 500,
                              py: 2,
                              borderColor: isSelected
                                ? "primary.main"
                                : slot.is_available
                                ? "primary.light"
                                : "divider",
                              bgcolor: isSelected
                                ? "primary.main"
                                : slot.is_available
                                ? theme.palette.mode === "dark"
                                  ? "rgba(20, 184, 166, 0.08)"
                                  : "rgba(13, 148, 136, 0.05)"
                                : undefined,
                              textDecoration: slot.is_booked ? "line-through" : "none",
                              color: slot.is_booked ? "text.disabled" : undefined,
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* Afternoon Slots */}
              {afternoonSlots.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
                    <NightlightRound fontSize="inherit" sx={{ color: "#38bdf8" }} /> AFTERNOON SESSIONS (12:00 – 16:00)
                  </Typography>
                  <Grid container spacing={1}>
                    {afternoonSlots.map((slot) => {
                      const isSelected =
                        selectedSlot &&
                        selectedSlot.date === selectedDate &&
                        selectedSlot.start_time === slot.start_time;

                      return (
                        <Grid item xs={6} sm={4} key={slot.start_time}>
                          <Chip
                            label={`${slot.start_time} - ${slot.end_time}`}
                            clickable={slot.is_available}
                            onClick={() => handleSlotClick(slot)}
                            color={isSelected ? "primary" : slot.is_available ? "default" : "default"}
                            variant={isSelected ? "filled" : "outlined"}
                            disabled={!slot.is_available}
                            icon={isSelected ? <CheckCircle fontSize="small" /> : undefined}
                            sx={{
                              width: "100%",
                              fontWeight: isSelected ? 700 : 500,
                              py: 2,
                              borderColor: isSelected
                                ? "primary.main"
                                : slot.is_available
                                ? "primary.light"
                                : "divider",
                              bgcolor: isSelected
                                ? "primary.main"
                                : slot.is_available
                                ? theme.palette.mode === "dark"
                                  ? "rgba(20, 184, 166, 0.08)"
                                  : "rgba(13, 148, 136, 0.05)"
                                : undefined,
                              textDecoration: slot.is_booked ? "line-through" : "none",
                              color: slot.is_booked ? "text.disabled" : undefined,
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TimeSlotPicker;
