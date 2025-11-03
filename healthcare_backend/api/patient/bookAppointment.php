<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../../config/db_connect.php';
require_once '../../core/functions.php';
require_once '../../config/headers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(['success' => false, 'message' => 'Invalid request method.']));
}

// Read raw POST data
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    die(json_encode(['success' => false, 'message' => 'Invalid JSON: ' . json_last_error_msg()]));
}

$patient_id = intval($data['patient_id'] ?? 0);
$doctor_id = intval($data['doctor_id'] ?? 0);
$datetime = sanitize($data['start_datetime'] ?? '');
$notes = sanitize($data['notes'] ?? '');

// Validate required fields
if (!$patient_id || !$doctor_id || !$datetime) {
    die(json_encode(['success' => false, 'message' => 'Patient ID, Doctor ID, and Date/Time are required.']));
}

// Fix datetime format for MySQL DATETIME
if (strlen($datetime) === 16) { // e.g., '2025-11-10 14:00'
    $datetime .= ':00';
}

// Prepare SQL
$stmt = $mysqli->prepare("
    INSERT INTO appointments (patient_id, doctor_id, datetime, status, notes)
    VALUES (?, ?, ?, 'scheduled', ?)
");

if (!$stmt) {
    die(json_encode(['success' => false, 'message' => 'Prepare failed: ' . $mysqli->error]));
}

$stmt->bind_param("iiss", $patient_id, $doctor_id, $datetime, $notes);

if (!$stmt->execute()) {
    die(json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]));
}

echo json_encode(['success' => true, 'message' => 'Appointment booked successfully.']);
exit;
