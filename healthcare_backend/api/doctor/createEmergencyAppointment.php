<?php
require_once __DIR__ . '/../../includes/session_check.php';
require_role('doctor');
require_once __DIR__ . '/../../config/db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);
$patient_id = isset($input['patient_id']) ? (int)$input['patient_id'] : 0;
$datetime_raw = trim($input['datetime'] ?? '');

if ($patient_id <= 0 || $datetime_raw === '') {
  echo json_encode(['success' => false, 'message' => 'patient_id and datetime are required']);
  exit;
}

$dt = date_create($datetime_raw);
if (!$dt) {
  echo json_encode(['success' => false, 'message' => 'Invalid datetime']);
  exit;
}
$slot = date_format($dt, 'Y-m-d H:i:s');

// derive doctor_id from session user
$user_id = (int)$_SESSION['user_id'];
$getDoc = $mysqli->prepare('SELECT doctor_id FROM doctors WHERE user_id = ?');
$getDoc->bind_param('i', $user_id);
$getDoc->execute();
$docRes = $getDoc->get_result();
if ($docRes->num_rows === 0) {
  echo json_encode(['success' => false, 'message' => 'Doctor profile not found']);
  exit;
}
$doctor_id = (int)$docRes->fetch_assoc()['doctor_id'];

// emergency skips daily limit but must still obey UNIQUE(doctor_id, datetime)
$ins = $mysqli->prepare('INSERT INTO appointments (patient_id, doctor_id, datetime, status, is_emergency) VALUES (?, ?, ?, "scheduled", 1)');
$ins->bind_param('iis', $patient_id, $doctor_id, $slot);
if ($ins->execute()) {
  echo json_encode(['success' => true, 'message' => 'Emergency appointment created']);
} else {
  if ($ins->errno === 1062) {
    echo json_encode(['success' => false, 'message' => 'This time slot is already booked']);
  } else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $ins->error]);
  }
}
