package com.dentist.dto;

import com.dentist.entity.Patient;

public record AuthResponse(
    String token,
    Long patientId,
    String fullName,
    String email,
    String role
) {
    public static AuthResponse of(String token, Patient patient) {
        return new AuthResponse(token, patient.getId(), patient.getFullName(), patient.getEmail(),
            patient.getRole() != null ? patient.getRole().name() : "PATIENT");
    }
}
