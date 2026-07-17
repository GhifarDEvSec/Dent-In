package com.dentist.service;

import com.dentist.dto.DentistRequest;
import com.dentist.entity.Dentist;
import com.dentist.exception.ResourceNotFoundException;
import com.dentist.repository.DentistRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DentistService {

    private final DentistRepository dentistRepository;

    public DentistService(DentistRepository dentistRepository) {
        this.dentistRepository = dentistRepository;
    }

    public List<Dentist> getAllDentists() {
        return dentistRepository.findAll();
    }

    public Dentist getDentistById(Long id) {
        return dentistRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dentist not found with id: " + id));
    }

    public Dentist createDentist(DentistRequest request) {
        if (dentistRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }
        Dentist dentist = new Dentist();
        applyFields(dentist, request);
        return dentistRepository.save(dentist);
    }

    public Dentist updateDentist(Long id, DentistRequest request) {
        Dentist dentist = getDentistById(id);
        applyFields(dentist, request);
        return dentistRepository.save(dentist);
    }

    public void deleteDentist(Long id) {
        Dentist dentist = getDentistById(id);
        dentistRepository.delete(dentist);
    }

    public List<Dentist> getActiveDentists() {
        return dentistRepository.findByActiveTrue();
    }

    public Dentist setActive(Long id, boolean active) {
        Dentist dentist = getDentistById(id);
        dentist.setActive(active);
        return dentistRepository.save(dentist);
    }

    private void applyFields(Dentist d, DentistRequest r) {
        if (r.fullName() != null) d.setFullName(r.fullName());
        if (r.email() != null) d.setEmail(r.email());
        if (r.phone() != null) d.setPhone(r.phone());
        if (r.specialization() != null) d.setSpecialization(r.specialization());
        if (r.licenseNumber() != null) d.setLicenseNumber(r.licenseNumber());
        if (r.clinic() != null) d.setClinic(r.clinic());
        if (r.clinicAddress() != null) d.setClinicAddress(r.clinicAddress());
        if (r.latitude() != null) d.setLatitude(r.latitude());
        if (r.longitude() != null) d.setLongitude(r.longitude());
        if (r.openingHours() != null) d.setOpeningHours(r.openingHours());
        if (r.colorHex() != null) d.setColorHex(r.colorHex());
        if (r.initials() != null) d.setInitials(r.initials());
        if (r.dentistType() != null) d.setDentistType(r.dentistType());
        d.setActive(true);
    }
}
