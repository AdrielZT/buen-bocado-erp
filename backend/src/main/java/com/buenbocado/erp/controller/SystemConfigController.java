package com.buenbocado.erp.controller;

import com.buenbocado.erp.dto.config.AuditLogDto;
import com.buenbocado.erp.dto.config.PlantPolicyDto;
import com.buenbocado.erp.dto.config.SystemHealthDto;
import com.buenbocado.erp.dto.config.UserDto;
import com.buenbocado.erp.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/config")
@RequiredArgsConstructor
@Tag(name = "Configuration & Audit", description = "Endpoints para gobernanza, usuarios RBAC, políticas de planta y salud del sistema")
public class SystemConfigController {

    private final SystemConfigService configService;

    @GetMapping("/users")
    @Operation(summary = "Listar usuarios del sistema con roles asignados")
    public ResponseEntity<List<UserDto>> getUsers() {
        return ResponseEntity.ok(configService.getUsers());
    }

    @PostMapping("/users")
    @Operation(summary = "Crear nuevo usuario con rol operativo")
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto req) {
        return ResponseEntity.ok(configService.createUser(req));
    }

    @GetMapping("/policies")
    @Operation(summary = "Obtener políticas operativas y parámetros de la planta")
    public ResponseEntity<PlantPolicyDto> getPolicies() {
        return ResponseEntity.ok(configService.getPolicies());
    }

    @PutMapping("/policies")
    @Operation(summary = "Actualizar políticas operativas y tolerancias de planta")
    public ResponseEntity<PlantPolicyDto> updatePolicies(@RequestBody PlantPolicyDto req) {
        return ResponseEntity.ok(configService.updatePolicies(req));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Obtener registro de auditoría inmutable de transacciones críticas")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs() {
        return ResponseEntity.ok(configService.getAuditLogs());
    }

    @GetMapping("/system-health")
    @Operation(summary = "Consultar estado de salud de servicios, base de datos y colas")
    public ResponseEntity<SystemHealthDto> getSystemHealth() {
        return ResponseEntity.ok(configService.getSystemHealth());
    }
}
