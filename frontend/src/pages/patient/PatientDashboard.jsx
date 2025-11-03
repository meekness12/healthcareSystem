import React, { useEffect, useState } from "react";
import { Typography, Box } from "@mui/material";
import PatientLayout from "./PatientLayout";

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || { user_id: 1, name: "Patient" };

  // Mock or fetch API later
  useEffect(() => {
    setAppointments([
      { id: 1, doctor: "Dr. Alice Uwase", department: "Cardiology", datetime: "2025-11-03 09:00", status: "Scheduled" },
      { id: 2, doctor: "Dr. John Niyonsenga", department: "General Medicine", datetime: "2025-11-05 11:00", status: "Scheduled" },
    ]);
    setRecords([
      { id: 1, type: "Blood Test", doctor: "Dr. Alice Uwase", date: "2025-10-20", notes: "Normal" },
      { id: 2, type: "X-Ray", doctor: "Dr. John Niyonsenga", date: "2025-10-15", notes: "Minor fracture" },
    ]);
  }, []);

  return (
    <PatientLayout>
      <Typography variant="h4" gutterBottom>
        Welcome, {user.name}
      </Typography>

      {/* Upcoming Appointments */}
      <Box sx={{ mb: 4, p: 2, bgcolor: "#fff", borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom>Upcoming Appointments</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td>{appt.id}</td>
                <td>{appt.doctor}</td>
                <td>{appt.department}</td>
                <td>{appt.datetime}</td>
                <td>{appt.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Recent Medical Records */}
      <Box sx={{ mb: 4, p: 2, bgcolor: "#fff", borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom>Recent Medical Records</Typography>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.id}</td>
                <td>{rec.type}</td>
                <td>{rec.doctor}</td>
                <td>{rec.date}</td>
                <td>{rec.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </PatientLayout>
  );
};

export default PatientDashboard;
