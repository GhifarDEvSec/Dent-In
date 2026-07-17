package com.dentist.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dentists")
public class Dentist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String specialization;

    private String licenseNumber;

    private boolean active = true;

    /* ---- Display fields used by the Dent-in frontend (added in the merge) ---- */
    private String clinic;

    private Double rating;

    private Integer reviewsCount;

    private String experience;      // e.g. "12 yrs"

    private String nextSlot;        // e.g. "Today · 14:30"

    private String colorHex;        // avatar gradient start, e.g. "2F80ED"

    private String initials;        // e.g. "AW"

    private String dentistType;     // "specialist" | "general"

    private String clinicAddress;
    private Double latitude;
    private Double longitude;
    private String openingHours;    // e.g. "Mon-Fri 08:00-20:00"

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Dentist() {}

    public Dentist(String fullName, String email, String specialization) {
        this.fullName = fullName;
        this.email = email;
        this.specialization = specialization;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getClinic() { return clinic; }
    public void setClinic(String clinic) { this.clinic = clinic; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviewsCount() { return reviewsCount; }
    public void setReviewsCount(Integer reviewsCount) { this.reviewsCount = reviewsCount; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getNextSlot() { return nextSlot; }
    public void setNextSlot(String nextSlot) { this.nextSlot = nextSlot; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getInitials() { return initials; }
    public void setInitials(String initials) { this.initials = initials; }

    public String getDentistType() { return dentistType; }
    public void setDentistType(String dentistType) { this.dentistType = dentistType; }
    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
