import api from "./client";

export const billingApi = {
  // Invoices
  getInvoices: async (params = {}) => {
    const response = await api.get("/invoices", { params });
    return response.data;
  },

  getInvoice: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data) => {
    const response = await api.post("/invoices", data);
    return response.data;
  },

  generateFromAppointment: async (appointmentId) => {
    const response = await api.post(`/invoices/generate-from-appointment/${appointmentId}`);
    return response.data;
  },

  downloadInvoicePdf: async (id) => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Payments
  getPayments: async (params = {}) => {
    const response = await api.get("/payments", { params });
    return response.data;
  },

  processPayment: async (data) => {
    const response = await api.post("/payments", data);
    return response.data;
  },

  getPayment: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  getReceipt: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/receipt`);
    return response.data;
  },

  downloadReceiptPdf: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/receipt/pdf`, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `receipt-${paymentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Insurance Claims
  getClaims: async (params = {}) => {
    const response = await api.get("/insurance-claims", { params });
    return response.data;
  },

  getClaimsStats: async () => {
    const response = await api.get("/insurance-claims/stats");
    return response.data;
  },

  createClaim: async (data) => {
    const response = await api.post("/insurance-claims", data);
    return response.data;
  },

  updateClaimStatus: async (id, data) => {
    const response = await api.patch(`/insurance-claims/${id}/status`, data);
    return response.data;
  },
};

export default billingApi;
