import apiClient from "./client";

export const pharmacyApi = {
  // Get active doctor prescriptions waiting for dispensing
  getPrescriptionsQueue: async (params = {}) => {
    const response = await apiClient.get("/pharmacy/prescriptions", { params });
    return response.data;
  },

  // Dispense medication items and decrement warehouse stock
  dispenseMedications: async (payload) => {
    const response = await apiClient.post("/pharmacy/dispense", payload);
    return response.data;
  },

  // Get medicine inventory stock levels and reorder alerts
  getInventory: async (params = {}) => {
    const response = await apiClient.get("/pharmacy/inventory", { params });
    return response.data;
  },

  // Get historical dispensations
  getHistory: async (params = {}) => {
    const response = await apiClient.get("/pharmacy/history", { params });
    return response.data;
  },
};

export default pharmacyApi;
