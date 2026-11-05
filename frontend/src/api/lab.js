import apiClient from "./client";

export const labApi = {
  // Get active laboratory test types catalogue
  getTestTypes: async (params = {}) => {
    const response = await apiClient.get("/lab/test-types", { params });
    return response.data;
  },

  // List laboratory tests queue
  getLabTests: async (params = {}) => {
    const response = await apiClient.get("/lab/tests", { params });
    return response.data;
  },

  // Order a new laboratory test
  orderLabTest: async (payload) => {
    const response = await apiClient.post("/lab/tests", payload);
    return response.data;
  },

  // Claim/assign a laboratory test to current technician
  claimLabTest: async (id) => {
    const response = await apiClient.post(`/lab/tests/${id}/assign`);
    return response.data;
  },

  // Record diagnostic observations and upload PDF report
  recordLabResult: async (id, formData) => {
    const response = await apiClient.post(`/lab/tests/${id}/result`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Download PDF report
  downloadReport: async (resultId) => {
    const response = await apiClient.get(`/lab/results/${resultId}/download`, {
      responseType: "blob",
    });
    return response;
  },
};

export default labApi;
