import apiClient from "./client";

export const prescriptionApi = {
  // List prescriptions (?patient_id, ?doctor_id, ?status)
  getPrescriptions: async (params = {}) => {
    const response = await apiClient.get("/prescriptions", { params });
    return response.data;
  },

  // Issue a new standalone electronic prescription
  issuePrescription: async (payload) => {
    const response = await apiClient.post("/prescriptions", payload);
    return response.data;
  },

  // Get single prescription details
  getPrescription: async (id) => {
    const response = await apiClient.get(`/prescriptions/${id}`);
    return response.data;
  },

  // Update prescription status (dispensed, cancelled, etc.)
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/prescriptions/${id}/status`, { status });
    return response.data;
  },
};

export default prescriptionApi;
