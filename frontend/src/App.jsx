import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSettings from "./pages/profile/ProfileSettings";
import BranchDirectory from "./pages/branches/BranchDirectory";
import DoctorDirectory from "./pages/doctors/DoctorDirectory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import ReportsExport from "./pages/admin/ReportsExport";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorScheduleManager from "./pages/doctor/DoctorScheduleManager";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorConsultationRoom from "./pages/doctor/DoctorConsultationRoom";
import EmergencyTriage from "./pages/emergency/EmergencyTriage";
import PatientDashboard from "./pages/patient/PatientDashboard";
import MyAppointments from "./pages/patient/MyAppointments";
import MedicalRecords from "./pages/patient/MedicalRecords";
import BookAppointment from "./pages/patient/BookAppointment";
import LabDashboard from "./pages/lab/LabDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import BillingDashboard from "./pages/billing/BillingDashboard";
import PatientBilling from "./pages/patient/PatientBilling";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            {/* Default Landing */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/branches" element={<BranchDirectory />} />
            <Route path="/doctors" element={<DoctorDirectory />} />

            {/* Authenticated Profile Route for all roles */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ReportsExport />
                </ProtectedRoute>
              }
            />

            {/* Doctor routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                  <DoctorScheduleManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                  <DoctorAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/consultation/:appointmentId"
              element={
                <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                  <DoctorConsultationRoom />
                </ProtectedRoute>
              }
            />

            {/* Emergency Triage (Accessible to staff and walk-in intakes) */}
            <Route
              path="/emergency/triage"
              element={
                <ProtectedRoute>
                  <EmergencyTriage />
                </ProtectedRoute>
              }
            />

            {/* Laboratory Technician Routes */}
            <Route
              path="/lab/dashboard"
              element={
                <ProtectedRoute allowedRoles={["lab_technician", "admin"]}>
                  <LabDashboard />
                </ProtectedRoute>
              }
            />

            {/* Pharmacy Dispensary Routes */}
            <Route
              path="/pharmacy/dashboard"
              element={
                <ProtectedRoute allowedRoles={["pharmacist", "admin"]}>
                  <PharmacyDashboard />
                </ProtectedRoute>
              }
            />

            {/* Billing & Insurance Claims Routes */}
            <Route
              path="/billing/dashboard"
              element={
                <ProtectedRoute allowedRoles={["billing_officer", "admin"]}>
                  <BillingDashboard />
                </ProtectedRoute>
              }
            />

            {/* Patient routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/records"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <MedicalRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/billing"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book-appointment"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <BookAppointment />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </Router>
  );
}

export default App;
