package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.entity.Dentist;
import com.dentist.service.MapsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maps")
public class MapsController {

    private final MapsService mapsService;

    public MapsController(MapsService mapsService) {
        this.mapsService = mapsService;
    }

    @GetMapping("/api-key")
    public ResponseEntity<ApiResponse<Map<String, String>>> getApiKey() {
        return ResponseEntity.ok(ApiResponse.success("MapTiler API key",
            Map.of("key", mapsService.getMaptilerKey())));
    }

    @GetMapping("/locations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLocations() {
        return ResponseEntity.ok(ApiResponse.success("Dentist locations",
            mapsService.getDentistLocations()));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<Dentist>>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "25") double radiusKm) {
        return ResponseEntity.ok(ApiResponse.success("Nearby dentists",
            mapsService.getNearbyDentists(lat, lng, radiusKm)));
    }

    @GetMapping("/directions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWithDirections(
            @RequestParam double lat,
            @RequestParam double lng) {
        return ResponseEntity.ok(ApiResponse.success("Dentist locations with directions",
            mapsService.getDentistLocationsWithDirections(lat, lng)));
    }
}
