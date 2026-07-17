package com.dentist.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentRequest(
    Long patientId,
    Long dentistId,
    LocalDate appointmentDate,
    LocalTime appointmentTime,
    String reason,
    String notes
) {}
