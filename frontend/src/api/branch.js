import apiClient from "./client";

export const branchApi = {
  // Get all branches with optional province / search filters
  getBranches: async (params = {}) => {
    const response = await apiClient.get("/branches", { params });
    return response.data;
  },

  // Get single branch with departments
  getBranch: async (id) => {
    const response = await apiClient.get(`/branches/${id}`);
    return response.data;
  },

  // Get departments with optional branch_id filter
  getDepartments: async (params = {}) => {
    const response = await apiClient.get("/departments", { params });
    return response.data;
  },

  // Get all specialties
  getSpecialties: async () => {
    const response = await apiClient.get("/specialties");
    return response.data;
  },
};

export default branchApi;
