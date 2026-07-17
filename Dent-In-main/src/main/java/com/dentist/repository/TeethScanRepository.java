package com.dentist.repository;

import com.dentist.entity.TeethScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TeethScanRepository extends JpaRepository<TeethScan, Long> {
    List<TeethScan> findByPatientId(Long patientId);
    List<TeethScan> findByDentistId(Long dentistId);
    List<TeethScan> findByStatus(TeethScan.ScanStatus status);
}
