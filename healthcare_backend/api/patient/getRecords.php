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

// Get patient_id from GET params
$patient_id = isset($_GET["patient_id"]) ? intval($_GET["patient_id"]) : null;
if (!$patient_id) {
    echo json_encode(["success" => false, "message" => "Patient ID is required."]);
    exit;
}

// Fetch lab tests with doctor info and appointment date
$query = "
    SELECT 
        lt.test_id AS id,
        lt.appt_id AS appointment_id,
        lt.type,
        lt.result,
        lt.status,
        lt.report_url,
        ap.datetime AS appointment_date,
        d.user_id AS doctor_id,
        u.name AS doctor_name
    FROM lab_tests lt
    INNER JOIN appointments ap ON lt.appt_id = ap.appt_id
    INNER JOIN doctors d ON ap.doctor_id = d.doctor_id
    INNER JOIN users u ON d.user_id = u.user_id
    WHERE ap.patient_id = ?
    ORDER BY lt.test_id DESC
";

$stmt = $mysqli->prepare($query);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("i", $patient_id);
$stmt->execute();
$result = $stmt->get_result();

$records = [];
while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode(["success" => true, "records" => $records]);

$stmt->close();
$mysqli->close();
?>
