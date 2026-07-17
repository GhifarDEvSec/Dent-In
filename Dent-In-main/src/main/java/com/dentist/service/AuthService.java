package com.dentist.service;

import com.dentist.dto.AuthResponse;
import com.dentist.dto.LoginRequest;
import com.dentist.dto.RegisterRequest;
import com.dentist.entity.Patient;
import com.dentist.repository.PatientRepository;
import com.dentist.util.JwtUtil;
import com.dentist.util.PasswordUtil;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final PatientRepository patientRepository;
    private final JwtUtil jwtUtil;

    public AuthService(PatientRepository patientRepository, JwtUtil jwtUtil) {
        this.patientRepository = patientRepository;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.password() == null || request.password().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (patientRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }

        Patient patient = new Patient();
        patient.setFullName(request.fullName());
        patient.setEmail(request.email());
        patient.setPhone(request.phone());
        patient.setAddress(request.address());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setEmergencyContact(request.emergencyContact());
        patient.setMedicalHistory(request.medicalHistory());

        String salt = PasswordUtil.generateSalt();
        patient.setPasswordSalt(salt);
        patient.setPasswordHash(PasswordUtil.hash(request.password(), salt));

        Patient saved = patientRepository.save(patient);
        String role = saved.getRole() != null ? saved.getRole().name() : "PATIENT";
        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail(), role);
        return AuthResponse.of(token, saved);
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.identifier() == null ? "" : request.identifier().trim();

        Optional<Patient> byEmail = patientRepository.findByEmailIgnoreCase(identifier);
        Optional<Patient> found = byEmail.isPresent()
            ? byEmail
            : patientRepository.findByPhone(identifier);

        Patient patient = found.orElseThrow(() ->
            new IllegalArgumentException("That email/phone and password don't match our records."));

        if (patient.getPasswordHash() == null ||
            !PasswordUtil.matches(request.password(), patient.getPasswordSalt(), patient.getPasswordHash())) {
            throw new IllegalArgumentException("That email/phone and password don't match our records.");
        }

        String role = patient.getRole() != null ? patient.getRole().name() : "PATIENT";
        String token = jwtUtil.generateToken(patient.getId(), patient.getEmail(), role);
        return AuthResponse.of(token, patient);
    }
}
