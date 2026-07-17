package com.dentist.dto;

public record NotificationRequest(
    Long patientId,
    String title,
    String message,
    String type,
    String channel,
    String actionUrl
) {}
