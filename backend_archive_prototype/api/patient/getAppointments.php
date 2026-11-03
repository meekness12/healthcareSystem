<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once("../../config/db_connect.php");

$user_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;

if ($user_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid user ID"]);
    exit;
}

// Step 1: Find patient_id using user_id
$stmt = $mysqli->prepare("SELECT patient_id FROM patients WHERE user_id = ?");
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed (patients): " . $mysqli->error]);
    exit;
}
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$patient = $result->fetch_assoc();

if (!$patient) {
    echo json_encode(["success" => false, "message" => "No patient found for this user", "appointments" => []]);
    exit;
}

$patient_id = $patient['patient_id'];

// Step 2: Fetch appointments (join doctors + users to get doctor name)
$query = "
    SELECT 
        a.appt_id,
        a.datetime,
        a.status,
        a.notes,
        u.name AS doctor_name,         -- ✅ name comes from users table
        d.department AS department
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN users u ON d.user_id = u.user_id   -- ✅ link to users for doctor’s name
    WHERE a.patient_id = ?
    ORDER BY a.datetime DESC
";
$stmt = $mysqli->prepare($query);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed (appointments): " . $mysqli->error]);
    exit;
}
$stmt->bind_param("i", $patient_id);
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    $appointments[] = $row;
}

echo json_encode(["success" => true, "appointments" => $appointments]);
?>
