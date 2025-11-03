<?php
class AppointmentModel {
    private $mysqli;

    public function __construct($mysqli) {
        $this->mysqli = $mysqli;
    }

    // Fetch appointments for a patient
    public function getAppointmentsByPatient($patient_id) {
        $stmt = $this->mysqli->prepare("
            SELECT a.appointment_id, u.name AS doctor, d.department, a.start_datetime, a.status
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            JOIN users u ON d.user_id = u.user_id
            WHERE a.patient_id = ?
            ORDER BY a.start_datetime DESC
        ");
        $stmt->bind_param("i", $patient_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    // Add a new appointment
    public function addAppointment($patient_id, $doctor_id, $start_datetime) {
        $stmt = $this->mysqli->prepare("
            INSERT INTO appointments (patient_id, doctor_id, start_datetime, status)
            VALUES (?, ?, ?, 'Scheduled')
        ");
        $stmt->bind_param("iis", $patient_id, $doctor_id, $start_datetime);
        return $stmt->execute();
    }
}
