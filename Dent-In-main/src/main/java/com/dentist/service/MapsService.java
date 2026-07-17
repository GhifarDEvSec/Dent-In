package com.dentist.service;

import com.dentist.entity.Dentist;
import com.dentist.repository.DentistRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class MapsService {

    private final DentistRepository dentistRepository;

    @Value("${maptiler.key:}")
    private String maptilerKey;

    public MapsService(DentistRepository dentistRepository) {
        this.dentistRepository = dentistRepository;
    }

    public String getMaptilerKey() {
        return maptilerKey;
    }

    public List<Dentist> getNearbyDentists(double userLat, double userLng, double radiusKm) {
        return dentistRepository.findByActiveTrue().stream()
            .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
            .filter(d -> haversineKm(userLat, userLng, d.getLatitude(), d.getLongitude()) <= radiusKm)
            .sorted(Comparator.comparingDouble(d ->
                haversineKm(userLat, userLng, d.getLatitude(), d.getLongitude())))
            .toList();
    }

    public List<Map<String, Object>> getDentistLocations() {
        return dentistRepository.findByActiveTrue().stream()
            .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
            .map(d -> Map.<String, Object>of(
                "id", d.getId(),
                "name", d.getFullName(),
                "clinic", d.getClinic() != null ? d.getClinic() : "",
                "address", d.getClinicAddress() != null ? d.getClinicAddress() : "",
                "specialization", d.getSpecialization(),
                "latitude", d.getLatitude(),
                "longitude", d.getLongitude(),
                "rating", d.getRating() != null ? d.getRating() : 0,
                "initials", d.getInitials() != null ? d.getInitials() : "",
                "colorHex", d.getColorHex() != null ? d.getColorHex() : "2F80ED"
            ))
            .toList();
    }

    public List<Map<String, Object>> getDentistLocationsWithDirections(double userLat, double userLng) {
        List<Map<String, Object>> locations = getDentistLocations();
        locations.forEach(loc -> {
            double lat = (Double) loc.get("latitude");
            double lng = (Double) loc.get("longitude");
            double dist = haversineKm(userLat, userLng, lat, lng);
            loc.put("distanceKm", Math.round(dist * 10.0) / 10.0);
            loc.put("maptilerUrl", "https://www.maptiler.com/maps/?marker="
                + lat + "," + lng + "&zoom=14");
            loc.put("directionsUrl", "https://www.google.com/maps/dir/?api=1"
                + "&origin=" + userLat + "," + userLng
                + "&destination=" + lat + "," + lng
                + "&travelmode=driving");
        });
        return locations.stream()
            .sorted(Comparator.comparingDouble(l -> (Double) l.get("distanceKm")))
            .toList();
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
