import api from "./client";

export const adminApi = {
  // Analytics
  getOverview: async () => {
    const response = await api.get("/admin/analytics/overview");
    return response.data;
  },

  getAppointmentTrends: async (params = {}) => {
    const response = await api.get("/admin/analytics/appointment-trends", { params });
    return response.data;
  },

  getRevenueByBranch: async () => {
    const response = await api.get("/admin/analytics/revenue-by-branch");
    return response.data;
  },

  getDepartmentWorkloads: async () => {
    const response = await api.get("/admin/analytics/department-workloads");
    return response.data;
  },

  getKpis: async () => {
    const response = await api.get("/admin/analytics/kpis");
    return response.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post("/admin/users", data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  toggleUserStatus: async (id, status) => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get("/admin/audit-logs", { params });
    return response.data;
  },

  getAuditLog: async (id) => {
    const response = await api.get(`/admin/audit-logs/${id}`);
    return response.data;
  },

  // Exports
  downloadAppointmentsCsv: async (params = {}) => {
    const response = await api.get("/admin/export/appointments-csv", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `appointments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadRevenueCsv: async (params = {}) => {
    const response = await api.get("/admin/export/revenue-csv", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `revenue_transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadAuditLogsCsv: async (params = {}) => {
    const response = await api.get("/admin/export/audit-logs-csv", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadExecutiveReportPdf: async () => {
    const response = await api.get("/admin/export/executive-report-pdf", {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Executive_Healthcare_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default adminApi;
