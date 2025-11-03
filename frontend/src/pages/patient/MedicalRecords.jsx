import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import PatientLayout from "./PatientLayout";

const MedicalRecords = () => {
  const user = JSON.parse(localStorage.getItem("user")) || { user_id: 1 };
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`http://localhost/healthcare_backend/api/patient/getMedicalRecords.php?patient_id=${user.user_id}`);
        const data = await res.json();
        setRecords(data.records || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecords();
  }, [user.user_id]);

  return (
    <PatientLayout>
      <Typography variant="h4" gutterBottom>Medical Records</Typography>
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
          {records.map((rec, idx) => (
            <tr key={rec.id}>
              <td>{idx + 1}</td>
              <td>{rec.type}</td>
              <td>{rec.doctor}</td>
              <td>{rec.date}</td>
              <td>{rec.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PatientLayout>
  );
};

export default MedicalRecords;
