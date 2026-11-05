import apiClient from "./client";

export const consultationApi = {
  // List consultations with filters (?patient_id, ?doctor_id)
  getConsultations: async (params = {}) => {
    const response = await apiClient.get("/consultations", { params });
    return response.data;
  },

  // Record a new clinical consultation encounter
  recordConsultation: async (payload) => {
    const response = await apiClient.post("/consultations", payload);
    return response.data;
  },

  // Get single consultation details
  getConsultation: async (id) => {
    const response = await apiClient.get(`/consultations/${id}`);
    return response.data;
  },

  // Get full chronological clinical EHR history for a patient
  getPatientHistory: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}/consultation-history`);
    return response.data;
  },
};

export default consultationApi;
