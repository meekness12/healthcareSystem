-- Fix patient_reviews table definition (previous migration had trailing comma)
USE healthcare_system;

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
