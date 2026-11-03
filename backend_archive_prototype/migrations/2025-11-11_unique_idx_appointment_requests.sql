-- Enforce uniqueness to avoid duplicate pending requests
USE healthcare_system;

ALTER TABLE appointment_requests
  ADD UNIQUE KEY uq_appt_req_doctor_patient_datetime (doctor_id, patient_id, requested_datetime);
