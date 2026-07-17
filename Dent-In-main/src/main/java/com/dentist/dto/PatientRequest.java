package com.dentist.dto;

import java.time.LocalDate;

public record PatientRequest(
    String fullName,
    String email,
    String phone,
    String address,
    LocalDate dateOfBirth,
    String gender,
    String emergencyContact,
    String medicalHistory
) {}
