package com.dentist.dto;

public record OtpRequest(
    String email,
    String purpose
) {}
