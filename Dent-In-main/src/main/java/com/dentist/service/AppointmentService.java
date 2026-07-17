package com.dentist.service;

import com.dentist.dto.AppointmentRequest;
import com.dentist.entity.Appointment;
import com.dentist.entity.Dentist;
import com.dentist.entity.Patient;
import com.dentist.exception.ResourceNotFoundException;
import com.dentist.repository.AppointmentRepository;
import com.dentist.repository.DentistRepository;
import com.dentist.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;
    private final NotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientRepository patientRepository,
                              DentistRepository dentistRepository,
                              NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.dentistRepository = dentistRepository;
        this.notificationService = notificationService;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
    }

    public Appointment createAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.patientId()));
        Dentist dentist = dentistRepository.findById(request.dentistId())
            .orElseThrow(() -> new ResourceNotFoundException("Dentist not found with id: " + request.dentistId()));

        List<Appointment> existing = appointmentRepository
            .findByDentistIdAndAppointmentDate(dentist.getId(), request.appointmentDate());

        boolean conflict = existing.stream()
            .filter(a -> a.getAppointmentTime().equals(request.appointmentTime()))
            .anyMatch(a -> a.getStatus() != Appointment.AppointmentStatus.CANCELLED);

        if (conflict) {
            throw new IllegalArgumentException("Dentist already has an appointment at this time");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDentist(dentist);
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setAppointmentTime(request.appointmentTime());
        appointment.setReason(request.reason());
        appointment.setNotes(request.notes());

        Appointment saved = appointmentRepository.save(appointment);

        // Create notification for the patient
        try {
            notificationService.sendAppointmentConfirmation(
                patient,
                dentist.getFullName(),
                request.appointmentDate().toString(),
                request.appointmentTime().toString().substring(0, 5)
            );
        } catch (Exception e) {
            // notification failure should not block appointment creation
        }

        return saved;
    }

    public Appointment updateAppointmentStatus(Long id, Appointment.AppointmentStatus status) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    public void cancelAppointment(Long id) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        Appointment appointment = getAppointmentById(id);
        appointmentRepository.delete(appointment);
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDentist(Long dentistId) {
        return appointmentRepository.findByDentistId(dentistId);
    }
}
