package com.dentist.dto;

/** identifier = email or phone number. */
public record LoginRequest(
    String identifier,
    String password
) {}
