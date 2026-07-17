package com.dentist.dto;

public record PrescriptionRequest(
    Long patientId,
    Long dentistId,
    String diagnosis,
    String medicationDetails,
    String instructions,
    String notesToPatient
) {}
