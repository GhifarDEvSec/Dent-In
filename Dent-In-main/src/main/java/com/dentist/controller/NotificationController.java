package com.dentist.controller;

import com.dentist.dto.ApiResponse;
import com.dentist.dto.NotificationRequest;
import com.dentist.entity.Notification;
import com.dentist.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Notification>>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved",
            notificationService.getByPatient(patientId)));
    }

    @GetMapping("/patient/{patientId}/unread")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnread(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Unread notifications",
            notificationService.getUnread(patientId)));
    }

    @GetMapping("/patient/{patientId}/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Unread count",
            Map.of("count", notificationService.countUnread(patientId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Notification>> create(@RequestBody NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Notification created", notificationService.createAndSend(request)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Marked as read", notificationService.markAsRead(id)));
    }

    @PatchMapping("/patient/{patientId}/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@PathVariable Long patientId) {
        notificationService.markAllAsRead(patientId);
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
    }
}
