import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import PatientLayout from "./PatientLayout";

const MyAppointments = () => {
  const user = JSON.parse(localStorage.getItem("user")) || { user_id: 1 };
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`http://localhost/healthcare_backend/api/patient/getAppointments.php?patient_id=${user.user_id}`);
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointments();
  }, [user.user_id]);

  return (
    <PatientLayout>
      <Typography variant="h4" gutterBottom>Your Appointments</Typography>
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
          {appointments.map((appt, idx) => (
            <tr key={appt.appt_id}>
              <td>{idx + 1}</td>
              <td>{appt.doctor_name}</td>
              <td>{appt.department}</td>
              <td>{appt.datetime}</td>
              <td>{appt.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PatientLayout>
  );
};

export default MyAppointments;
