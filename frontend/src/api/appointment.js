import apiClient from "./client";

export const appointmentApi = {
  // Book a new appointment
  bookAppointment: async (payload) => {
    const response = await apiClient.post("/appointments", payload);
    return response.data;
  },

  // Get appointments with filters
  getAppointments: async (params = {}) => {
    const response = await apiClient.get("/appointments", { params });
    return response.data;
  },

  // Get single appointment details
  getAppointment: async (id) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  // Update appointment status (confirm, complete, cancel, no-show)
  updateStatus: async (id, payload) => {
    const response = await apiClient.put(`/appointments/${id}/status`, payload);
    return response.data;
  },

  // Reschedule appointment
  reschedule: async (id, payload) => {
    const response = await apiClient.put(`/appointments/${id}/reschedule`, payload);
    return response.data;
  },

  // Emergency Triage Fast-Track Intake
  emergencyTriage: async (payload) => {
    const response = await apiClient.post("/emergency/triage-intake", payload);
    return response.data;
  },
};

export default appointmentApi;
