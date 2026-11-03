<?php
require_once(__DIR__ . '/../../includes/session_check.php');
require_role('doctor');
require_once(__DIR__ . '/../../config/db_connect.php');

// Get doctor_id for the logged-in user
$user_id = (int)$_SESSION['user_id'];
$docStmt = $mysqli->prepare('SELECT doctor_id FROM doctors WHERE user_id = ?');
$docStmt->bind_param('i', $user_id);
$docStmt->execute();
$docRes = $docStmt->get_result();
if ($docRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Doctor profile not found"]);
    exit;
}
$doctor_id = (int)$docRes->fetch_assoc()['doctor_id'];

// Fetch pending appointment requests for this doctor
$stmt = $mysqli->prepare('
    SELECT r.request_id, r.patient_id, r.doctor_id, r.requested_datetime, r.reason, r.status, r.created_at,
           u.name AS patient_name
    FROM appointment_requests r
    JOIN patients p ON r.patient_id = p.patient_id
    JOIN users u ON p.user_id = u.user_id
    WHERE r.doctor_id = ? AND r.status = "pending"
    ORDER BY r.requested_datetime ASC
');
$stmt->bind_param('i', $doctor_id);
$stmt->execute();
$result = $stmt->get_result();

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode(["success" => true, "data" => $rows]);
?>
