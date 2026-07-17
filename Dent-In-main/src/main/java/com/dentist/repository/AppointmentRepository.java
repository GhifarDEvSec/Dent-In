package com.dentist.repository;

import com.dentist.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDentistId(Long dentistId);
    List<Appointment> findByDentistIdAndAppointmentDate(Long dentistId, LocalDate date);
    List<Appointment> findByAppointmentDate(LocalDate date);
    List<Appointment> findByPatientIdAndStatus(Long patientId, Appointment.AppointmentStatus status);
}
