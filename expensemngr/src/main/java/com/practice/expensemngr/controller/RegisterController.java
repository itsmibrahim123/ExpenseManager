package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.CloseRegisterDTO;
import com.practice.expensemngr.dto.DailySummaryDTO;
import com.practice.expensemngr.dto.OpenRegisterDTO;
import com.practice.expensemngr.dto.RegisterSessionResponseDTO;
import com.practice.expensemngr.service.DailyRegisterService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@Validated
@RestController
@RequestMapping("/register")
public class RegisterController {

    @Autowired
    private DailyRegisterService dailyRegisterService;

    @PostMapping("/open")
    public ResponseEntity<RegisterSessionResponseDTO> openSession(@Valid @RequestBody OpenRegisterDTO request) {
        RegisterSessionResponseDTO session = dailyRegisterService.openSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/close/{sessionId}")
    public ResponseEntity<RegisterSessionResponseDTO> closeSession(
            @PathVariable Long sessionId,
            @Valid @RequestBody CloseRegisterDTO request) {
        RegisterSessionResponseDTO session = dailyRegisterService.closeSession(sessionId, request);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/active")
    public ResponseEntity<RegisterSessionResponseDTO> getActiveSession(@RequestParam Long userId) {
        RegisterSessionResponseDTO session = dailyRegisterService.getCurrentSession(userId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/daily-summary")
    public ResponseEntity<DailySummaryDTO> getDailySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date date,
            @RequestParam(required = false) Long userId) {
        DailySummaryDTO summary = dailyRegisterService.getDailySummary(date, userId);
        return ResponseEntity.ok(summary);
    }
}
