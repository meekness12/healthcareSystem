<?php
require_once '../../config/db_connect.php';
require_once '../../core/functions.php';
require_once '../../models/PatientModel.php';
require_once '../../config/headers.php';

// Get patient_id from GET params
$patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : null;
if (!$patient_id) jsonResponse(false, "Patient ID is required.");

// Fetch data
$model = new PatientModel($mysqli);
$data = $model->getMedicalRecords($patient_id);

// Send JSON response
jsonResponse(true, "Medical records fetched successfully.", $data);
