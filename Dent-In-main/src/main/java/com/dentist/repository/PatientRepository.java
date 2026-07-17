package com.dentist.repository;

import com.dentist.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByEmailIgnoreCase(String email);
    Optional<Patient> findByPhone(String phone);
    List<Patient> findByFullNameContainingIgnoreCase(String fullName);
    boolean existsByEmail(String email);
}
