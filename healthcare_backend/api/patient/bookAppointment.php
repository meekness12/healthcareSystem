<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once "../../config/db_connect.php";

// ✅ Handle preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ✅ Handle only POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["patient_id"], $data["doctor_id"], $data["start_datetime"])) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$patient_id = $data["patient_id"];
$doctor_id = $data["doctor_id"];
$datetime = $data["start_datetime"];
$notes = $data["notes"] ?? null;

$sql = "INSERT INTO appointments (patient_id, doctor_id, datetime, status, notes)
        VALUES (?, ?, ?, 'scheduled', ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiss", $patient_id, $doctor_id, $datetime, $notes);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Appointment booked successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
}
?>
