<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once "../../config/db_connect.php";

// Get patient_id from query parameters
$patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;

if (!$patient_id) {
    echo json_encode([
        "success" => false,
        "message" => "Patient ID is required"
    ]);
    exit;
}

// Fetch appointments with doctor info and notes
$sql = "SELECT a.appt_id, a.datetime, a.status, a.notes, 
               u.name AS doctor_name, d.department
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.doctor_id
        JOIN users u ON d.user_id = u.user_id
        WHERE a.patient_id = ?
        ORDER BY a.datetime DESC";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $patient_id);
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    $appointments[] = $row;
}

echo json_encode([
    "success" => true,
    "appointments" => $appointments
]);

$stmt->close();
$mysqli->close();
?>
