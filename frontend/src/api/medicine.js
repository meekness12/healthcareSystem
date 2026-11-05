import apiClient from "./client";

export const medicineApi = {
  // Search medicines with optional filters: ?q=, ?category=, ?in_stock_only=true
  getMedicines: async (params = {}) => {
    const response = await apiClient.get("/medicines", { params });
    return response.data;
  },

  // Get distinct categories
  getCategories: async () => {
    const response = await apiClient.get("/medicines/categories");
    return response.data;
  },

  // Get single medicine details
  getMedicine: async (id) => {
    const response = await apiClient.get(`/medicines/${id}`);
    return response.data;
  },
};

export default medicineApi;
