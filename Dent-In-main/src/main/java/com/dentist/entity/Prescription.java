package com.dentist.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dentist_id", nullable = false)
    private Dentist dentist;

    @Column(nullable = false)
    private LocalDate prescriptionDate;

    @Column(nullable = false)
    private String diagnosis;

    @Lob
    private String medicationDetails;
    private String instructions;
    private String notesToPatient;
    private boolean sentToPatient = false;
    private LocalDateTime sentAt;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Prescription() {}

    public Prescription(Patient patient, Dentist dentist, String diagnosis, String medicationDetails) {
        this.patient = patient;
        this.dentist = dentist;
        this.diagnosis = diagnosis;
        this.medicationDetails = medicationDetails;
        this.prescriptionDate = LocalDate.now();
    }

    // Ngambil dan Memberi
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Dentist getDentist() { return dentist; }
    public void setDentist(Dentist dentist) { this.dentist = dentist; }

    public LocalDate getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDate prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getMedicationDetails() { return medicationDetails; }
    public void setMedicationDetails(String medicationDetails) { this.medicationDetails = medicationDetails; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public String getNotesToPatient() { return notesToPatient; }
    public void setNotesToPatient(String notesToPatient) { this.notesToPatient = notesToPatient; }

    public boolean isSentToPatient() {return sentToPatient;}
    public void setSentToPatient(boolean sentToPatient) { this.sentToPatient = sentToPatient;}
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
