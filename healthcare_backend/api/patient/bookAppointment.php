<?php
require_once __DIR__ . '/../../includes/session_check.php';
require_role('patient');
require_once __DIR__ . '/../../config/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['success' => false, 'message' => 'Invalid request method']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
  echo json_encode(['success' => false, 'message' => 'Invalid input']);
  exit;
}

$doctor_id = isset($data['doctor_id']) ? (int)$data['doctor_id'] : 0;
$requested_raw = trim($data['start_datetime'] ?? ''); // keep frontend compatibility
$reason = trim($data['notes'] ?? '');

if ($doctor_id <= 0 || $requested_raw === '') {
  echo json_encode(['success' => false, 'message' => 'doctor_id and start_datetime are required']);
  exit;
}

$dt = date_create($requested_raw);
if (!$dt) {
  echo json_encode(['success' => false, 'message' => 'Invalid datetime format']);
  exit;
}
$requested_datetime = date_format($dt, 'Y-m-d H:i:s');

// Get patient_id from session user_id
$user_id = (int)$_SESSION['user_id'];
$getPatient = $mysqli->prepare('SELECT patient_id FROM patients WHERE user_id = ?');
if (!$getPatient) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Prepare failed (getPatient)', 'error' => $mysqli->error]);
  exit;
}
$getPatient->bind_param('i', $user_id);
$getPatient->execute();
$res = $getPatient->get_result();
if ($res->num_rows === 0) {
  echo json_encode(['success' => false, 'message' => 'Patient profile not found']);
  exit;
}
$patient_id = (int)$res->fetch_assoc()['patient_id'];

// Insert appointment request
$ins = $mysqli->prepare('INSERT INTO `appointment_requests` (`patient_id`, `doctor_id`, `requested_datetime`, `reason`, `status`) VALUES (?, ?, ?, ?, \'pending\')');
if ($ins) {
  $ins->bind_param('iiss', $patient_id, $doctor_id, $requested_datetime, $reason);
  if ($ins->execute()) {
    echo json_encode(['success' => true, 'message' => 'Appointment request submitted']);
  } else {
    http_response_code(500);
    if ($ins->errno === 1062) {
      echo json_encode(['success' => false, 'message' => 'You already requested this time']);
    } else {
      echo json_encode(['success' => false, 'message' => 'Execute failed (insert)', 'error' => $ins->error]);
    }
  }
} else {
  // Fallback to safe direct insert
  $rdt = $mysqli->real_escape_string($requested_datetime);
  $rreason = $mysqli->real_escape_string($reason);
  $sqlIns = "INSERT INTO `appointment_requests` (`patient_id`, `doctor_id`, `requested_datetime`, `reason`, `status`) VALUES ($patient_id, $doctor_id, '$rdt', '$rreason', 'pending')";
  if ($mysqli->query($sqlIns)) {
    echo json_encode(['success' => true, 'message' => 'Appointment request submitted']);
  } else {
    http_response_code(500);
    if ($mysqli->errno === 1062) {
      echo json_encode(['success' => false, 'message' => 'You already requested this time']);
    } else {
      echo json_encode(['success' => false, 'message' => 'Insert query error', 'error' => $mysqli->error, 'sql' => $sqlIns]);
    }
  }
}
?>
