<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/db_connect.php";

$doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
if ($doctor_id <= 0) {
    echo json_encode(["success"=>false,"message"=>"Invalid doctor_id"]);
    exit;
}

$sql = "
  SELECT a.appt_id, a.patient_id, a.datetime, a.status, a.notes,
         p.patient_id AS patient_pk, u.name AS patient_name, p.dob, p.gender
  FROM appointments a
  JOIN patients p ON a.patient_id = p.patient_id
  JOIN users u ON p.user_id = u.user_id
  WHERE a.doctor_id = ? AND a.status = 'scheduled' AND a.datetime >= NOW()
  ORDER BY a.datetime ASC
  LIMIT 1
";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success"=>false,"message"=>"Prepare failed: ".$mysqli->error]);
    exit;
}
$stmt->bind_param("i", $doctor_id);
$stmt->execute();
$res = $stmt->get_result();
$next = $res->fetch_assoc();
if (!$next) {
    echo json_encode(["success"=>true,"message"=>"No upcoming appointments","next"=>null]);
} else {
    echo json_encode(["success"=>true,"next"=>$next]);
}
$stmt->close();
$mysqli->close();
