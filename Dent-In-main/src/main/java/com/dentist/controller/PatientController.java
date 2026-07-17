package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.dto.PatientRequest;
import com.dentist.entity.Patient;
import com.dentist.service.PatientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Patient>>> getAllPatients() {
        return ResponseEntity.ok(ApiResponse.success("Patients retrieved", patientService.getAllPatients()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Patient>> getPatientById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Patient retrieved", patientService.getPatientById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Patient>> createPatient(@RequestBody PatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Patient created", patientService.createPatient(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Patient>> updatePatient(@PathVariable Long id, @RequestBody PatientRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Patient updated", patientService.updatePatient(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.success("Patient deleted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Patient>>> searchPatients(@RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.success("Patients found", patientService.searchPatients(name)));
    }
}
