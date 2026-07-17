package com.dentist.service;

import com.dentist.dto.PrescriptionRequest;
import com.dentist.entity.Dentist;
import com.dentist.entity.Patient;
import com.dentist.entity.Prescription;
import com.dentist.exception.ResourceNotFoundException;
import com.dentist.repository.DentistRepository;
import com.dentist.repository.PatientRepository;
import com.dentist.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               PatientRepository patientRepository,
                               DentistRepository dentistRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.dentistRepository = dentistRepository;
    }

    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
    }

    public Prescription createPrescription(PrescriptionRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.patientId()));
        Dentist dentist = dentistRepository.findById(request.dentistId())
            .orElseThrow(() -> new ResourceNotFoundException("Dentist not found with id: " + request.dentistId()));

        Prescription prescription = new Prescription();
        prescription.setPatient(patient);
        prescription.setDentist(dentist);
        prescription.setDiagnosis(request.diagnosis());
        prescription.setMedicationDetails(request.medicationDetails());
        prescription.setInstructions(request.instructions());
        prescription.setNotesToPatient(request.notesToPatient());
        prescription.setPrescriptionDate(java.time.LocalDate.now());

        return prescriptionRepository.save(prescription);
    }

    public Prescription sendPrescriptionToPatient(Long id) {
        Prescription prescription = getPrescriptionById(id);
        prescription.setSentToPatient(true);
        prescription.setSentAt(LocalDateTime.now());
        // TODO: integrate email/notification service to actually send to patient
        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getPrescriptionsByPatient(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsByDentist(Long dentistId) {
        return prescriptionRepository.findByDentistId(dentistId);
    }

    public List<Prescription> getUnsentPrescriptions() {
        return prescriptionRepository.findBySentToPatientFalse();
    }

    public void deletePrescription(Long id) {
        Prescription prescription = getPrescriptionById(id);
        prescriptionRepository.delete(prescription);
    }
}
