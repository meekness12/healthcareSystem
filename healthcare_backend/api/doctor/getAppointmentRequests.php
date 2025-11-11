<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once(__DIR__ . "/../../config/db_connect.php");

// SQL query to fetch appointment requests (adjust table names if needed)
$query = "
    SELECT 
        a.appt_id,
        p.patient_id,
        u.name AS patient_name,
        d.doctor_id,
        du.name AS doctor_name,
        a.datetime,
        a.status,
        a.notes
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    JOIN users u ON p.user_id = u.user_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN users du ON d.user_id = du.user_id
    ORDER BY a.datetime DESC
";

$result = $mysqli->query($query);

if (!$result) {
    echo json_encode([
        "success" => false,
        "message" => "Query failed: " . $mysqli->error
    ]);
    exit;
}

$response = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $response[] = $row;
    }
    echo json_encode(["success" => true, "data" => $response]);
} else {
    echo json_encode(["success" => false, "message" => "No appointment requests found"]);
}

if (isset($mysqli) && $mysqli instanceof mysqli) {
    $mysqli->close();
}
?>
