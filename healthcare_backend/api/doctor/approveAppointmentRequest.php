<?php
require_once __DIR__ . '/../../includes/session_check.php';
require_role('doctor');
require_once __DIR__ . '/../../config/db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);
$request_id = isset($input['request_id']) ? (int)$input['request_id'] : 0;
if ($request_id <= 0) {
  echo json_encode(['success' => false, 'message' => 'request_id is required']);
  exit;
}

// Get doctor_id for current user
$user_id = (int)$_SESSION['user_id'];
$getDoc = $mysqli->prepare('SELECT doctor_id, max_daily_appointments FROM doctors WHERE user_id = ?');
$getDoc->bind_param('i', $user_id);
$getDoc->execute();
$docRes = $getDoc->get_result();
if ($docRes->num_rows === 0) {
  echo json_encode(['success' => false, 'message' => 'Doctor profile not found']);
  exit;
}
$docRow = $docRes->fetch_assoc();
$doctor_id = (int)$docRow['doctor_id'];
$max_daily = (int)$docRow['max_daily_appointments'];

// Load request and ensure it targets this doctor and is pending
$getReq = $mysqli->prepare('SELECT request_id, patient_id, doctor_id, requested_datetime FROM appointment_requests WHERE request_id = ? AND status = "pending"');
$getReq->bind_param('i', $request_id);
$getReq->execute();
$reqRes = $getReq->get_result();
if ($reqRes->num_rows === 0) {
  echo json_encode(['success' => false, 'message' => 'Request not found or not pending']);
  exit;
}
$req = $reqRes->fetch_assoc();
if ((int)$req['doctor_id'] !== $doctor_id) {
  echo json_encode(['success' => false, 'message' => 'Forbidden: not your request']);
  exit;
}

$patient_id = (int)$req['patient_id'];
$slot = $req['requested_datetime'];

// Enforce daily limit (count scheduled on same date)
$dateOnly = substr($slot, 0, 10);
$cnt = $mysqli->prepare('SELECT COUNT(*) as c FROM appointments WHERE doctor_id = ? AND DATE(datetime) = ? AND status IN ("scheduled","completed")');
$cnt->bind_param('is', $doctor_id, $dateOnly);
$cnt->execute();
$cRes = $cnt->get_result();
$currCount = (int)$cRes->fetch_assoc()['c'];
if ($currCount >= $max_daily) {
  echo json_encode(['success' => false, 'message' => 'Daily appointment limit reached for this date']);
  exit;
}

$mysqli->begin_transaction();
try {
  // Create appointment
  $ins = $mysqli->prepare('INSERT INTO appointments (patient_id, doctor_id, datetime, status, is_emergency) VALUES (?, ?, ?, "scheduled", 0)');
  $ins->bind_param('iis', $patient_id, $doctor_id, $slot);
  $ok = $ins->execute();
  if (!$ok) {
    if ($ins->errno === 1062) { // duplicate unique (doctor_id, datetime)
      $mysqli->rollback();
      echo json_encode(['success' => false, 'message' => 'This time slot is already booked']);
      exit;
    }
    throw new Exception('Insert failed: ' . $ins->error);
  }

  // Delete request
  $del = $mysqli->prepare('DELETE FROM appointment_requests WHERE request_id = ?');
  $del->bind_param('i', $request_id);
  if (!$del->execute()) {
    throw new Exception('Failed to delete request: ' . $del->error);
  }

  $mysqli->commit();
  echo json_encode(['success' => true, 'message' => 'Appointment approved and scheduled']);
} catch (Exception $e) {
  $mysqli->rollback();
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Server error', 'detail' => $e->getMessage()]);
}
