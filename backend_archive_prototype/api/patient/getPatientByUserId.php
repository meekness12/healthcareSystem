<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

include_once "../../config/db_connect.php";

// Handle preflight request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

// Get user_id from GET params
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) {
    echo json_encode(["success" => false, "message" => "User ID is required."]);
    exit;
}

// Fetch patient_id from patients table
$stmt = $mysqli->prepare("SELECT patient_id FROM patients WHERE user_id = ?");
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No patient found for this user_id"]);
    exit;
}

$row = $result->fetch_assoc();
$patient_id = $row['patient_id'];

echo json_encode([
    "success" => true,
    "patient_id" => $patient_id
]);

$stmt->close();
$mysqli->close();
?>
