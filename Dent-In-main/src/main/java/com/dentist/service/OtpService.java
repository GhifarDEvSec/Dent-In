package com.dentist.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_MS = 5 * 60 * 1000;

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Generates OTP and sends it via SMTP email with a 6-digit code.
     * Supabase OTP endpoint only sends magic links (not codes), so we always
     * use our own SMTP to send a proper 6-digit verification code.
     */
    public String generateAndSendOtp(String email, String purpose) {
        String code = generateCode();
        otpStore.put(email + ":" + purpose, new OtpEntry(code, System.currentTimeMillis()));

        boolean sent = sendViaEmail(email, code, purpose);
        if (!sent) {
            log.warn("╔══════════════════════════════════════════╗");
            log.warn("║  DEV MODE: OTP code for {}          ║", email);
            log.warn("║  Code: {}  Purpose: {}           ║", code, purpose);
            log.warn("║  (Gmail not configured — set MAIL_USERNAME/MAIL_PASSWORD in .env) ║");
            log.warn("╚══════════════════════════════════════════╝");
        }
        return code;
    }

    /**
     * Verifies OTP against the locally stored code.
     */
    public boolean verifyOtp(String email, String code, String purpose) {
        OtpEntry entry = otpStore.get(email + ":" + purpose);
        if (entry == null) return false;
        if (System.currentTimeMillis() - entry.createdAt > OTP_EXPIRY_MS) {
            otpStore.remove(email + ":" + purpose);
            return false;
        }
        boolean ok = entry.code.equals(code);
        if (ok) otpStore.remove(email + ":" + purpose);
        return ok;
    }

    private boolean sendViaEmail(String email, String code, String purpose) {
        try {
            String subject = switch (purpose) {
                case "register" -> "Dent-In — Verify Your Email";
                case "login" -> "Dent-In — Login Verification Code";
                case "reset_password" -> "Dent-In — Password Reset Code";
                default -> "Dent-In — Your Verification Code";
            };

            String htmlBody = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
                  <div style="background:linear-gradient(135deg,#2F80ED,#1B63C7);border-radius:12px;padding:24px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;">Dent-In</h1>
                  </div>
                  <div style="padding:32px 24px;text-align:center;">
                    <h2 style="color:#0E2A47;margin:0 0 8px;">Verification Code</h2>
                    <p style="color:#667;margin:0 0 24px;">Use the code below to verify your email address.</p>
                    <div style="background:#F4F7FB;border-radius:8px;padding:16px;margin:0 0 24px;">
                      <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#2F80ED;">%s</span>
                    </div>
                    <p style="color:#999;font-size:13px;margin:0;">This code expires in 5 minutes.</p>
                    <p style="color:#999;font-size:13px;margin:8px 0 0;">If you didn't request this, ignore this email.</p>
                  </div>
                </div>
                """.formatted(code);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom("Dent-In <" + fromEmail + ">");

            mailSender.send(message);
            log.info("OTP email sent to {} (purpose={})", email, purpose);
            return true;
        } catch (Exception e) {
            log.warn("SMTP send failed for {}: {} (OTP still works in dev mode)", email, e.getMessage());
            return false;
        }
    }

    public boolean isOtpPending(String email, String purpose) {
        OtpEntry entry = otpStore.get(email + ":" + purpose);
        if (entry == null) return false;
        if (System.currentTimeMillis() - entry.createdAt > OTP_EXPIRY_MS) {
            otpStore.remove(email + ":" + purpose);
            return false;
        }
        return true;
    }

    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredOtps() {
        long now = System.currentTimeMillis();
        otpStore.entrySet().removeIf(e -> now - e.getValue().createdAt > OTP_EXPIRY_MS);
    }

    private String generateCode() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        return String.format("%0" + OTP_LENGTH + "d", RANDOM.nextInt(bound));
    }

    private record OtpEntry(String code, long createdAt) {}
}
