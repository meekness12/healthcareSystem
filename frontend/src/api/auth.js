import apiClient from "./client";

/**
 * Authentication & Profile API Services
 */
export const authApi = {
  // Register new patient account
  register: async (payload) => {
    const response = await apiClient.post("/auth/register", payload);
    return response.data;
  },

  // Login existing user
  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  // Fetch currently authenticated user
  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  // Logout and revoke token
  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },

  // Update profile demographics
  updateProfile: async (data) => {
    const response = await apiClient.put("/auth/profile", data);
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    const response = await apiClient.put("/auth/password", data);
    return response.data;
  },

  // Upload avatar (multipart/form-data)
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post("/auth/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Public reference: insurance providers
  getInsuranceProviders: async () => {
    const response = await apiClient.get("/insurance-providers");
    return response.data;
  },
};

export default authApi;
