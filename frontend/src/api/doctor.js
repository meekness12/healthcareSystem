import apiClient from "./client";

export const doctorApi = {
  // Query doctors with branch, department, specialty, and keyword search filters
  getDoctors: async (params = {}) => {
    const response = await apiClient.get("/doctors", { params });
    return response.data;
  },

  // Get full doctor profile by ID
  getDoctor: async (id) => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  // Get doctor weekly schedule
  getDoctorSchedules: async (id) => {
    const response = await apiClient.get(`/doctors/${id}/schedules`);
    return response.data;
  },

  // Dynamic slot engine
  getAvailableSlots: async (id, date) => {
    const response = await apiClient.get(`/doctors/${id}/available-slots`, {
      params: { date },
    });
    return response.data;
  },
};

export default doctorApi;
