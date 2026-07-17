package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.dto.PrescriptionRequest;
import com.dentist.entity.Prescription;
import com.dentist.service.PrescriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Prescription>>> getAllPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success("Prescriptions retrieved", prescriptionService.getAllPrescriptions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Prescription>> getPrescriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Prescription retrieved", prescriptionService.getPrescriptionById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Prescription>> createPrescription(@RequestBody PrescriptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Prescription created", prescriptionService.createPrescription(request)));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<Prescription>> sendPrescription(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Prescription sent to patient", prescriptionService.sendPrescriptionToPatient(id)));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Prescription>>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Prescriptions retrieved", prescriptionService.getPrescriptionsByPatient(patientId)));
    }

    @GetMapping("/dentist/{dentistId}")
    public ResponseEntity<ApiResponse<List<Prescription>>> getByDentist(@PathVariable Long dentistId) {
        return ResponseEntity.ok(ApiResponse.success("Prescriptions retrieved", prescriptionService.getPrescriptionsByDentist(dentistId)));
    }

    @GetMapping("/unsent")
    public ResponseEntity<ApiResponse<List<Prescription>>> getUnsentPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success("Unsent prescriptions", prescriptionService.getUnsentPrescriptions()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePrescription(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok(ApiResponse.success("Prescription deleted", null));
    }
}
