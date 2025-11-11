-- Fix appointment_requests schema to match backend code
USE healthcare_system;

-- Rename incorrect column `diagnosis` -> `requested_datetime` and set proper type
ALTER TABLE appointment_requests
  CHANGE COLUMN diagnosis requested_datetime DATETIME NOT NULL;

-- Ensure `reason` column exists
ALTER TABLE appointment_requests
  ADD COLUMN IF NOT EXISTS reason TEXT AFTER requested_datetime;

-- Ensure `status` enum and default
ALTER TABLE appointment_requests
  MODIFY COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending';

-- Ensure created_at default
ALTER TABLE appointment_requests
  MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
