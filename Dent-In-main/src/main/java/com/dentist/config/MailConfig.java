package com.dentist.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(mailUsername);
        mailSender.setPassword(mailPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        if (mailUsername == null || mailUsername.isBlank()) {
            log.warn("[MAIL] No MAIL_USERNAME configured. Emails will not be sent. Set MAIL_USERNAME and MAIL_PASSWORD in .env");
        } else if (mailUsername.contains("your-email") || mailUsername.contains("example")) {
            log.warn("[MAIL] MAIL_USERNAME looks like a placeholder ('{}'). " +
                "Replace with a real Gmail address and a 16-char App Password from https://myaccount.google.com/apppasswords", mailUsername);
        } else {
            log.info("[MAIL] JavaMailSender configured for {}", mailUsername);
        }

        return mailSender;
    }
}
