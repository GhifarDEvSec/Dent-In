package com.dentist.service;

import com.dentist.dto.NotificationRequest;
import com.dentist.entity.Notification;
import com.dentist.entity.Patient;
import com.dentist.exception.ResourceNotFoundException;
import com.dentist.repository.NotificationRepository;
import com.dentist.repository.PatientRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final PatientRepository patientRepository;
    private final JavaMailSender mailSender;

    public NotificationService(NotificationRepository notificationRepository,
                               PatientRepository patientRepository,
                               JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.patientRepository = patientRepository;
        this.mailSender = mailSender;
    }

    public List<Notification> getByPatient(Long patientId) {
        return notificationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<Notification> getUnread(Long patientId) {
        return notificationRepository.findByPatientIdAndReadFalseOrderByCreatedAtDesc(patientId);
    }

    public long countUnread(Long patientId) {
        return notificationRepository.countByPatientIdAndReadFalse(patientId);
    }

    public Notification markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    public void markAllAsRead(Long patientId) {
        List<Notification> unread = notificationRepository.findByPatientIdAndReadFalseOrderByCreatedAtDesc(patientId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    public Notification createAndSend(NotificationRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.patientId()));

        Notification notif = new Notification();
        notif.setPatient(patient);
        notif.setTitle(request.title());
        notif.setMessage(request.message());
        notif.setType(Notification.NotificationType.valueOf(
            request.type() != null ? request.type() : "INFO"));
        notif.setChannel(Notification.NotificationChannel.valueOf(
            request.channel() != null ? request.channel() : "IN_APP"));
        notif.setActionUrl(request.actionUrl());

        Notification saved = notificationRepository.save(notif);

        // Send email notification to the patient
        sendEmailNotification(patient, request.title(), request.message());

        return saved;
    }

    private void sendEmailNotification(Patient patient, String title, String message) {
        try {
            String email = patient.getEmail();
            if (email == null || email.isBlank()) {
                log.warn("Cannot send email notification — patient {} has no email", patient.getId());
                return;
            }

            String htmlBody = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
                  <div style="background:linear-gradient(135deg,#2F80ED,#1B63C7);border-radius:12px;padding:24px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;">Dent-In</h1>
                  </div>
                  <div style="padding:32px 24px;">
                    <h2 style="color:#0E2A47;margin:0 0 12px;">%s</h2>
                    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">%s</p>
                    <a href="http://localhost:8080/#/home" style="display:inline-block;background:#2F80ED;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Open Dent-In</a>
                    <p style="color:#999;font-size:13px;margin:24px 0 0;">This is an automated notification from Dent-In.</p>
                  </div>
                </div>
                """.formatted(escapeHtml(title), escapeHtml(message));

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("Dent-In — " + title);
            helper.setText(htmlBody, true);
            helper.setFrom("Dent-In <noreply@dent-in.health>");

            mailSender.send(mimeMessage);
            log.info("Email notification sent to {} ({})", email, title);
        } catch (Exception e) {
            log.error("Failed to send email notification to patient {}: {}", patient.getId(), e.getMessage());
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    @Async
    public void sendAppointmentConfirmation(Patient patient, String dentistName, String date, String time) {
        createAndSend(new NotificationRequest(
            patient.getId(),
            "Appointment Confirmed",
            "Your appointment with " + dentistName + " on " + date + " at " + time + " has been confirmed.",
            "APPOINTMENT", "IN_APP", null
        ));
    }

    @Async
    public void sendAppointmentReminder(Patient patient, String dentistName, String date, String time) {
        createAndSend(new NotificationRequest(
            patient.getId(),
            "Appointment Reminder",
            "You have an appointment with " + dentistName + " tomorrow at " + time + ".",
            "APPOINTMENT", "IN_APP", null
        ));
    }

    @Async
    public void sendScanResult(Patient patient, double healthScore, String recommendations) {
        createAndSend(new NotificationRequest(
            patient.getId(),
            "AI Scan Results Ready",
            "Your dental scan analysis is complete. Health score: " + healthScore + "/100. " + recommendations,
            "SCAN_RESULT", "IN_APP", null
        ));
    }

    @Async
    public void sendPrescriptionReady(Patient patient, String diagnosis) {
        createAndSend(new NotificationRequest(
            patient.getId(),
            "New Prescription",
            "A new prescription for \"" + diagnosis + "\" has been sent to you by your dentist.",
            "PRESCRIPTION", "IN_APP", null
        ));
    }
}
