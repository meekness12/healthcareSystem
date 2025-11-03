import React, { useState } from "react";
import { Typography, Box, TextField, Button, Alert } from "@mui/material";
import PatientLayout from "./PatientLayout";

const BookAppointment = () => {
  const user = JSON.parse(localStorage.getItem("user")) || { user_id: 1 };
  const [doctorId, setDoctorId] = useState("");
  const [datetime, setDatetime] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setMessage(""); setStatus("");

    if (!doctorId || !datetime) {
      setMessage("Doctor and Date/Time are required.");
      setStatus("error");
      return;
    }

    const formattedDatetime = new Date(datetime).toISOString().slice(0, 19).replace("T", " ");

    try {
      const res = await fetch("http://localhost/healthcare_backend/api/patient/bookAppointment.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: user.user_id, doctor_id: doctorId, start_datetime: formattedDatetime, notes }),
      });
      const data = await res.json();
      setMessage(data.message);
      setStatus(data.success ? "success" : "error");
      if (data.success) setDoctorId(""); setDatetime(""); setNotes("");
    } catch (err) {
      console.error(err);
      setMessage("Server error.");
      setStatus("error");
    }
  };

  return (
    <PatientLayout>
      <Typography variant="h4" gutterBottom>Book Appointment</Typography>
      {message && <Alert severity={status} sx={{ mb: 2 }}>{message}</Alert>}
      <Box component="form" onSubmit={handleBookAppointment}>
        <TextField label="Doctor ID" type="number" fullWidth value={doctorId} onChange={(e) => setDoctorId(e.target.value)} margin="normal"/>
        <TextField label="Appointment Date & Time" type="datetime-local" fullWidth value={datetime} onChange={(e) => setDatetime(e.target.value)} margin="normal"/>
        <TextField label="Notes" multiline rows={3} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} margin="normal"/>
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Book Appointment</Button>
      </Box>
    </PatientLayout>
  );
};

export default BookAppointment;
