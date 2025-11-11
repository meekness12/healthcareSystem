<?php
require_once __DIR__ . "/../../config/headers.php";
require_once __DIR__ . "/../../config/db_connect.php";

$doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;

if ($doctor_id <= 0) {
    echo json_encode(["success"=>false,"message"=>"Invalid doctor_id"]);
    exit;
}

// Fetch appointments for the doctor filtered by date or date range
if ($start_date && $end_date) {
    $sql = "
      SELECT a.appt_id, a.patient_id, a.doctor_id, a.datetime, a.status, a.notes,
             u.name AS patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u ON p.user_id = u.user_id
      WHERE a.doctor_id = ? AND DATE(a.datetime) BETWEEN ? AND ?
      ORDER BY a.datetime ASC
    ";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success"=>false,"message"=>"Prepare failed: ".$mysqli->error]);
        exit;
    }
    $stmt->bind_param("iss", $doctor_id, $start_date, $end_date);
} else {
    $sql = "
      SELECT a.appt_id, a.patient_id, a.doctor_id, a.datetime, a.status, a.notes,
             u.name AS patient_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN users u ON p.user_id = u.user_id
      WHERE a.doctor_id = ? AND DATE(a.datetime) = ?
      ORDER BY a.datetime ASC
    ";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success"=>false,"message"=>"Prepare failed: ".$mysqli->error]);
        exit;
    }
    $stmt->bind_param("is", $doctor_id, $date);
}
$stmt->execute();
$res = $stmt->get_result();
$appts = [];
while ($row = $res->fetch_assoc()) $appts[] = $row;

echo json_encode(["success"=>true,"appointments"=>$appts]);

$stmt->close();
$mysqli->close();
