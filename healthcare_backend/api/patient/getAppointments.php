<?php
require_once '../../config/db_connect.php';
require_once '../../core/functions.php';
require_once '../../models/AppointmentModel.php';
require_once '../../config/headers.php';

// Get patient_id from GET params
$patient_id = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : null;
if (!$patient_id) jsonResponse(false, "Patient ID is required.");

// Fetch data
$model = new AppointmentModel($mysqli);
$data = $model->getAppointmentsByPatient($patient_id);

// Send JSON response
jsonResponse(true, "Appointments fetched successfully.", $data);
