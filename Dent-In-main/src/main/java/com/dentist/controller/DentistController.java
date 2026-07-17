package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.dto.DentistRequest;
import com.dentist.entity.Dentist;
import com.dentist.service.DentistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/dentists")
public class DentistController {

    private final DentistService dentistService;

    public DentistController(DentistService dentistService) {
        this.dentistService = dentistService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Dentist>>> getAllDentists() {
        return ResponseEntity.ok(ApiResponse.success("Dentists retrieved", dentistService.getAllDentists()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Dentist>> getDentistById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Dentist retrieved", dentistService.getDentistById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Dentist>> createDentist(@RequestBody DentistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Dentist created", dentistService.createDentist(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Dentist>> updateDentist(@PathVariable Long id, @RequestBody DentistRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Dentist updated", dentistService.updateDentist(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDentist(@PathVariable Long id) {
        dentistService.deleteDentist(id);
        return ResponseEntity.ok(ApiResponse.success("Dentist deleted", null));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<Dentist>> setActive(
            @PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(ApiResponse.success("Dentist updated", dentistService.setActive(id, active)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Dentist>>> getActiveDentists() {
        return ResponseEntity.ok(ApiResponse.success("Active dentists", dentistService.getActiveDentists()));
    }
}
