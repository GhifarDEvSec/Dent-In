package com.dentist.dto;

public record DentistRequest(
    String fullName,
    String email,
    String phone,
    String specialization,
    String licenseNumber,
    String clinic,
    String clinicAddress,
    Double latitude,
    Double longitude,
    String openingHours,
    String colorHex,
    String initials,
    String dentistType
) {}
