<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/db_connect.php";

$doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

if ($doctor_id <= 0) {
    echo json_encode(["success"=>false,"message"=>"Invalid doctor_id"]);
    exit;
}

// Fetch appointments for the doctor on the given date
$sql = "
  SELECT a.appt_id, a.patient_id, a.doctor_id, a.datetime, a.status, a.notes,
         p.patient_id AS patient_pk,
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
$stmt->execute();
$res = $stmt->get_result();
$appts = [];
while ($row = $res->fetch_assoc()) $appts[] = $row;

echo json_encode(["success"=>true,"appointments"=>$appts]);

$stmt->close();
$mysqli->close();
