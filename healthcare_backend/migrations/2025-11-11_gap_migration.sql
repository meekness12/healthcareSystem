-- Migration: Align schema with requirements and code
USE healthcare_system;

-- 1) Emergency flag on appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT 0;

-- 2) Prescriptions status for pharmacy workflow
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS status ENUM('issued','dispensed') DEFAULT 'issued';

-- 3) Appointment requests table (patient requests, doctor reviews)
CREATE TABLE IF NOT EXISTS appointment_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  requested_datetime DATETIME NOT NULL,
  reason TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  INDEX idx_req_doctor_datetime (doctor_id, requested_datetime)
);

-- 4) Patient reviews table
CREATE TABLE IF NOT EXISTS patient_reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  appt_id INT NOT NULL,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appt_id) REFERENCES appointments(appt_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  INDEX idx_reviews_doctor (doctor_id)
);

-- 5) Trigger to auto-create patient/doctor profiles on user insert
DROP TRIGGER IF EXISTS trg_after_user_insert;
DELIMITER $$
CREATE TRIGGER trg_after_user_insert AFTER INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'patient' THEN
    INSERT INTO patients (user_id, dob, gender, insurance_provider, allergies_json, history_json)
    VALUES (NEW.user_id, NULL, 'other', 'N/A', JSON_ARRAY(), JSON_ARRAY());
  END IF;

  IF NEW.role = 'doctor' THEN
    INSERT INTO doctors (user_id, specialty, department, room, max_daily_appointments)
    VALUES (NEW.user_id, 'General', 'General', 'TBD', 10);
  END IF;
END $$
DELIMITER ;
