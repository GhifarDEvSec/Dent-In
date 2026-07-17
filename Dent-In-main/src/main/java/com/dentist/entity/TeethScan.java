package com.dentist.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "teeth_scans")
public class TeethScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    @Column(nullable = false)
    private String imagePath;

    private String imageFileName;

    @Lob
    private String aiAnalysisResult;

    @Enumerated(EnumType.STRING)
    private ScanStatus status = ScanStatus.UPLOADED;

    private Double confidenceScore;

    private String detectedIssues;

    private String recommendations;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public TeethScan() {}

    public enum ScanStatus {
        UPLOADED, ANALYZING, COMPLETED, FAILED
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Dentist getDentist() { return dentist; }
    public void setDentist(Dentist dentist) { this.dentist = dentist; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public String getImageFileName() { return imageFileName; }
    public void setImageFileName(String imageFileName) { this.imageFileName = imageFileName; }

    public String getAiAnalysisResult() { return aiAnalysisResult; }
    public void setAiAnalysisResult(String aiAnalysisResult) { this.aiAnalysisResult = aiAnalysisResult; }

    public ScanStatus getStatus() { return status; }
    public void setStatus(ScanStatus status) { this.status = status; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getDetectedIssues() { return detectedIssues; }
    public void setDetectedIssues(String detectedIssues) { this.detectedIssues = detectedIssues; }

    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
