import apiClient from "./client";

export const medicalRecordApi = {
  // Get patient's uploaded medical files & scans
  getMedicalFiles: async (patientId, params = {}) => {
    const response = await apiClient.get(`/patients/${patientId}/medical-files`, { params });
    return response.data;
  },

  // Upload an external laboratory report or diagnostic scan
  uploadMedicalFile: async (patientId, formData) => {
    const response = await apiClient.post(`/patients/${patientId}/medical-files`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Download a medical file by ID
  downloadMedicalFile: async (fileId) => {
    const response = await apiClient.get(`/medical-files/${fileId}/download`, {
      responseType: "blob",
    });
    return response;
  },
};

export default medicalRecordApi;
