// src/api/patient.js
import axios from "axios";
import { API_BASE_URL } from "../config/constants";

// Backend base URL for patient endpoints
const BASE_URL = `${API_BASE_URL}/patient`;

// Book a new appointment
export const bookAppointment = async ({ patient_id, doctor_id, start_datetime, notes }) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/bookAppointment.php`,
      { patient_id, doctor_id, start_datetime, notes }
    );
    return response.data;
  } catch (error) {
    console.error("Error booking appointment:", error);
    return { success: false, message: "Server error." };
  }
};

// Fetch appointments for a patient
export const getAppointments = async (patient_id) => {
  try {
    const response = await axios.get(`${BASE_URL}/getAppointments.php?patient_id=${patient_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return { success: false, message: "Server error." };
  }
};

// Fetch medical records for a patient
export const getMedicalRecords = async (patient_id) => {
  try {
    const response = await axios.get(`${BASE_URL}/getRecords.php?patient_id=${patient_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return { success: false, message: "Server error." };
  }
};
