<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once "../../config/db_connect.php";

// Handle preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

// Decode JSON from frontend
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data["patient_id"], $data["doctor_id"], $data["start_datetime"])) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$user_id = $data["patient_id"]; // frontend sends user_id
$doctor_id = $data["doctor_id"];
$datetime = $data["start_datetime"];
$notes = $data["notes"] ?? "";

// Convert datetime to MySQL DATETIME format
$dt = date_create($datetime);
if (!$dt) {
    echo json_encode(["success" => false, "message" => "Invalid datetime format."]);
    exit;
}
$datetimeFormatted = date_format($dt, "Y-m-d H:i:s");

// Step 1: Get patient_id from user_id
$getPatient = $mysqli->prepare("SELECT patient_id FROM patients WHERE user_id = ?");
$getPatient->bind_param("i", $user_id);
$getPatient->execute();
$result = $getPatient->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Patient record not found."]);
    exit;
}

$row = $result->fetch_assoc();
$patient_id = $row["patient_id"];

// Step 2: Check if doctor already has an appointment at the same datetime
$check = $mysqli->prepare("SELECT appt_id FROM appointments WHERE doctor_id = ? AND datetime = ?");
$check->bind_param("is", $doctor_id, $datetimeFormatted);
$check->execute();
$checkResult = $check->get_result();

if ($checkResult->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Doctor already has an appointment at this time."]);
    exit;
}

// Step 3: Insert appointment
$stmt = $mysqli->prepare("INSERT INTO appointments (patient_id, doctor_id, datetime, status, notes) VALUES (?, ?, ?, 'scheduled', ?)");
$stmt->bind_param("iiss", $patient_id, $doctor_id, $datetimeFormatted, $notes);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Appointment booked successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
}

// Close connections
$stmt->close();
$check->close();
$getPatient->close();
$mysqli->close();
?>
