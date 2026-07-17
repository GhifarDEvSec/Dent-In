package com.dentist.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(nullable = false)
    private String title;

    @Lob
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type = NotificationType.INFO;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel = NotificationChannel.IN_APP;

    private boolean read = false;

    private String actionUrl;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(Patient patient, String title, String message, NotificationType type) {
        this.patient = patient;
        this.title = title;
        this.message = message;
        this.type = type;
    }

    public enum NotificationType {
        INFO, APPOINTMENT, PRESCRIPTION, SCAN_RESULT, SYSTEM, OTP
    }

    public enum NotificationChannel {
        IN_APP, EMAIL, SMS, PUSH
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public NotificationChannel getChannel() { return channel; }
    public void setChannel(NotificationChannel channel) { this.channel = channel; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
