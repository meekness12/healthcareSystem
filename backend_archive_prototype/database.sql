-- =========================================
-- DATABASE: healthcare_system
-- =========================================
CREATE DATABASE IF NOT EXISTS healthcare_system;
USE healthcare_system;

-- =========================================
-- TABLE: users
-- =========================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient','doctor','lab','pharmacy','admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLE: patients
-- =========================================
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dob DATE,
    gender ENUM('male','female','other'),
    insurance_provider VARCHAR(100),
    allergies_json JSON,
    history_json JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: doctors
-- =========================================
CREATE TABLE doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialty VARCHAR(100),
    department VARCHAR(100),
    room VARCHAR(20),
    max_daily_appointments INT DEFAULT 10,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: appointments
-- =========================================
CREATE TABLE appointments (
    appt_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    datetime DATETIME NOT NULL,
    status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    notes TEXT,
    UNIQUE KEY unique_appt (doctor_id, datetime),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: prescriptions
-- =========================================
CREATE TABLE prescriptions (
    pres_id INT AUTO_INCREMENT PRIMARY KEY,
    appt_id INT NOT NULL,
    doctor_id INT NOT NULL,
    medicines_json JSON NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appt_id) REFERENCES appointments(appt_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: lab_tests
-- =========================================
CREATE TABLE lab_tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    appt_id INT NOT NULL,
    type VARCHAR(100),
    result TEXT,
    status ENUM('pending','completed') DEFAULT 'pending',
    report_url VARCHAR(255),
    FOREIGN KEY (appt_id) REFERENCES appointments(appt_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: invoices
-- =========================================
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    appt_id INT,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('unpaid','paid','pending') DEFAULT 'unpaid',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (appt_id) REFERENCES appointments(appt_id) ON DELETE SET NULL
);

-- =========================================
-- TABLE: payments
-- =========================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('cash','card','insurance') NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: insurance_claims
-- =========================================
CREATE TABLE insurance_claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    invoice_id INT NOT NULL,
    status ENUM('submitted','processing','approved','rejected') DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: notifications
-- =========================================
CREATE TABLE notifications (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    type ENUM('appointment','payment','general') DEFAULT 'general',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================
-- TABLE: audit_logs
-- =========================================
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================================
-- INDEXES for performance
-- =========================================
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- =========================================
-- Sample Admin User (hashed password: admin123)
-- =========================================
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@hospital.com', 
        '$2y$10$u1fzZrWbKi/3rPkhjCKrQOXQZ3eGRbD2H9j3R5EGt5GZfE44jK0e6', 'admin');
