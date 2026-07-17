package com.dentist.dto;

public record OtpVerifyRequest(
    String email,
    String code,
    String purpose
) {}
