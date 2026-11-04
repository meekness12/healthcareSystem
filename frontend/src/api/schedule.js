import apiClient from "./client";

export const scheduleApi = {
  // Update doctor's weekly consultation schedule and status
  updateMySchedule: async (payload) => {
    const response = await apiClient.put("/doctor/my-schedule", payload);
    return response.data;
  },
};

export default scheduleApi;
