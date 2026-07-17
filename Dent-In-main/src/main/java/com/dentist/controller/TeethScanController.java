package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.entity.TeethScan;
import com.dentist.service.TeethScanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/scans")
public class TeethScanController {

    private final TeethScanService teethScanService;

    public TeethScanController(TeethScanService teethScanService) {
        this.teethScanService = teethScanService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<TeethScan>> uploadScan(
            @RequestParam Long patientId,
            @RequestParam(required = false) Long dentistId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Scan uploaded", teethScanService.uploadScan(patientId, dentistId, file)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeethScan>> getScanById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Scan retrieved", teethScanService.getScanById(id)));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<TeethScan>>> getScansByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Scans retrieved", teethScanService.getScansByPatient(patientId)));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<ApiResponse<TeethScan>> analyzeScan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Scan analyzed", teethScanService.analyzeScan(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeethScan>>> getAllScans() {
        return ResponseEntity.ok(ApiResponse.success("Scans retrieved", teethScanService.getAllScans()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteScan(@PathVariable Long id) {
        teethScanService.deleteScan(id);
        return ResponseEntity.ok(ApiResponse.success("Scan deleted", null));
    }
}
