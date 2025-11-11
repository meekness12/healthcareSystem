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

// Verify the request belongs to this doctor and is pending
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

$upd = $mysqli->prepare('UPDATE appointment_requests SET status = "rejected" WHERE request_id = ? AND doctor_id = ? AND status = "pending"');
$upd->bind_param('ii', $request_id, $doctor_id);
if ($upd->execute() && $upd->affected_rows > 0) {
  echo json_encode(['success' => true, 'message' => 'Appointment request rejected']);
} else {
  echo json_encode(['success' => false, 'message' => 'Request not found or already processed']);
}
