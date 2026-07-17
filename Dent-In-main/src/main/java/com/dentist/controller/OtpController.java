package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.dto.OtpRequest;
import com.dentist.dto.OtpVerifyRequest;
import com.dentist.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOtp(@RequestBody OtpRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Email is required"));
        }
        if (request.purpose() == null || request.purpose().isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Purpose is required (register, login, reset_password)"));
        }
        otpService.generateAndSendOtp(request.email(), request.purpose());
        return ResponseEntity.ok(ApiResponse.success(
            "Verification code sent to " + request.email(),
            Map.of("email", request.email(), "purpose", request.purpose(), "expiresIn", "5 minutes")
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@RequestBody OtpVerifyRequest request) {
        if (request.email() == null || request.code() == null || request.purpose() == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Email, code, and purpose are required"));
        }
        boolean verified = otpService.verifyOtp(request.email(), request.code(), request.purpose());
        if (!verified) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid or expired verification code"));
        }
        return ResponseEntity.ok(ApiResponse.success(
            "Verification successful",
            Map.of("email", request.email(), "purpose", request.purpose(), "verified", true)
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkStatus(
            @RequestParam String email, @RequestParam String purpose) {
        boolean pending = otpService.isOtpPending(email, purpose);
        return ResponseEntity.ok(ApiResponse.success(
            pending ? "OTP pending" : "No active OTP",
            Map.of("email", email, "purpose", purpose, "pending", pending)
        ));
    }
}
