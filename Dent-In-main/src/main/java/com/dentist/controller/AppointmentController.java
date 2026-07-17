package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.dto.AppointmentRequest;
import com.dentist.entity.Appointment;
import com.dentist.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Appointment>>> getAllAppointments() {
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved", appointmentService.getAllAppointments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Appointment>> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Appointment retrieved", appointmentService.getAppointmentById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Appointment>> createAppointment(@RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Appointment created", appointmentService.createAppointment(request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Appointment>> updateStatus(
            @PathVariable Long id,
            @RequestParam Appointment.AppointmentStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", appointmentService.updateAppointmentStatus(id, status)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Appointment deleted", null));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved", appointmentService.getAppointmentsByPatient(patientId)));
    }

    @GetMapping("/dentist/{dentistId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getByDentist(@PathVariable Long dentistId) {
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved", appointmentService.getAppointmentsByDentist(dentistId)));
    }
}
