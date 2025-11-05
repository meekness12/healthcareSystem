<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once "../../config/db_connect.php";

// Fetch all doctors
$sql = "SELECT d.doctor_id, u.name, d.specialty, d.department, d.room
        FROM doctors d
        JOIN users u ON d.user_id = u.user_id
        ORDER BY u.name ASC";

$result = $mysqli->query($sql);

if ($result) {
    $doctors = [];
    while ($row = $result->fetch_assoc()) {
        $doctors[] = $row;
    }
    echo json_encode([
        "success" => true,
        "doctors" => $doctors
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $mysqli->error
    ]);
}

$mysqli->close();
?>
