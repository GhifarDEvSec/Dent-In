package com.dentist.repository;

import com.dentist.entity.Dentist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DentistRepository extends JpaRepository<Dentist, Long> {
    Optional<Dentist> findByEmail(String email);
    List<Dentist> findBySpecialization(String specialization);
    List<Dentist> findByActiveTrue();
    boolean existsByEmail(String email);
}
