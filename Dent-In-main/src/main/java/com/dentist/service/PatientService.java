package com.dentist.service;

import com.dentist.dto.PatientRequest;
import com.dentist.entity.Patient;
import com.dentist.exception.ResourceNotFoundException;
import com.dentist.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
    }

    public Patient createPatient(PatientRequest request) {
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
        return patientRepository.save(patient);
    }

    public Patient updatePatient(Long id, PatientRequest request) {
        Patient patient = getPatientById(id);
        patient.setFullName(request.fullName());
        patient.setEmail(request.email());
        patient.setPhone(request.phone());
        patient.setAddress(request.address());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setEmergencyContact(request.emergencyContact());
        patient.setMedicalHistory(request.medicalHistory());
        return patientRepository.save(patient);
    }

    public void deletePatient(Long id) {
        Patient patient = getPatientById(id);
        patientRepository.delete(patient);
    }

    public List<Patient> searchPatients(String name) {
        return patientRepository.findByFullNameContainingIgnoreCase(name);
    }
}
