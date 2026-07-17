package com.dentist.repository;

import com.dentist.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Notification> findByPatientIdAndReadFalseOrderByCreatedAtDesc(Long patientId);
    long countByPatientIdAndReadFalse(Long patientId);
    void deleteByPatientId(Long patientId);
}
