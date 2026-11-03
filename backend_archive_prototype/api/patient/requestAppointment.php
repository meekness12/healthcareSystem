<?php
require_once __DIR__ . '/../../includes/session_check.php';
require_role('patient');
require_once __DIR__ . '/../../config/db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
  echo json_encode(['success' => false, 'message' => 'Invalid input']);
  exit;
}

$doctor_id = isset($input['doctor_id']) ? (int)$input['doctor_id'] : 0;
$requested_datetime_raw = trim($input['requested_datetime'] ?? '');
$reason = trim($input['reason'] ?? '');

if ($doctor_id <= 0 || $requested_datetime_raw === '') {
  echo json_encode(['success' => false, 'message' => 'doctor_id and requested_datetime are required']);
  exit;
}

$dt = date_create($requested_datetime_raw);
if (!$dt) {
  echo json_encode(['success' => false, 'message' => 'Invalid datetime']);
  exit;
}
$requested_datetime = date_format($dt, 'Y-m-d H:i:s');

// Get patient_id from session user_id
$user_id = (int)$_SESSION['user_id'];
$getPatient = $mysqli->prepare('SELECT patient_id FROM patients WHERE user_id = ?');
$getPatient->bind_param('i', $user_id);
$getPatient->execute();
$patientRes = $getPatient->get_result();
if ($patientRes->num_rows === 0) {
  echo json_encode(['success' => false, 'message' => 'Patient profile not found']);
  exit;
}
$patient_id = (int)$patientRes->fetch_assoc()['patient_id'];

// Optional: prevent duplicate pending requests for same slot
$dup = $mysqli->prepare('SELECT request_id FROM appointment_requests WHERE doctor_id = ? AND patient_id = ? AND requested_datetime = ? AND status = "pending"');
$dup->bind_param('iis', $doctor_id, $patient_id, $requested_datetime);
$dup->execute();
$dupRes = $dup->get_result();
if ($dupRes->num_rows > 0) {
  echo json_encode(['success' => false, 'message' => 'You already requested this time']);
  exit;
}

$ins = $mysqli->prepare('INSERT INTO appointment_requests (patient_id, doctor_id, requested_datetime, reason, status) VALUES (?, ?, ?, ?, "pending")');
$ins->bind_param('iiss', $patient_id, $doctor_id, $requested_datetime, $reason);
if ($ins->execute()) {
  echo json_encode(['success' => true, 'message' => 'Appointment request submitted']);
} else {
  echo json_encode(['success' => false, 'message' => 'Database error: ' . $ins->error]);
}
