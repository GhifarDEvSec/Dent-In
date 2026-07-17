package com.dentist.dto;

import java.time.LocalDate;

/** Registration payload: PatientRequest fields + a password (added in the merge). */
public record RegisterRequest(
    String fullName,
    String email,
    String phone,
    String address,
    LocalDate dateOfBirth,
    String gender,
    String emergencyContact,
    String medicalHistory,
    String password
) {}
