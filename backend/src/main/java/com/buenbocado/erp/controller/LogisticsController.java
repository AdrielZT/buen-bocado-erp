package com.buenbocado.erp.controller;

import com.buenbocado.erp.dto.logistics.DeliveryStopDto;
import com.buenbocado.erp.dto.logistics.LogisticsRouteSheetDto;
import com.buenbocado.erp.service.LogisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/logistics")
@RequiredArgsConstructor
@Tag(name = "Logistics & Dispatch", description = "Endpoints de hoja de ruta matutina, paradas de entrega y auditoría de fletes")
public class LogisticsController {

    private final LogisticsService logisticsService;

    @GetMapping("/routes")
    @Operation(summary = "Obtener hoja de ruta de entregas para un período o fecha específica")
    public ResponseEntity<LogisticsRouteSheetDto> getRouteSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = startDate;
        }
        return ResponseEntity.ok(logisticsService.getRouteSheet(startDate, endDate));
    }

    @PatchMapping("/orders/{id}/status")
    @Operation(summary = "Actualizar estado de entrega de una parada de reparto (IN_TRANSIT, DELIVERED, REJECTED)")
    public ResponseEntity<DeliveryStopDto> updateDeliveryStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload.getOrDefault("status", "IN_TRANSIT");
        String notes = payload.getOrDefault("notes", "");
        return ResponseEntity.ok(logisticsService.updateDeliveryStatus(id, newStatus, notes));
    }

    @PostMapping("/orders/{id}/deliver")
    @Operation(summary = "Confirmar entrega en el comercio y registrar cobranza si corresponde")
    public ResponseEntity<DeliveryStopDto> confirmDelivery(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        BigDecimal amount = BigDecimal.ZERO;
        if (payload.containsKey("amount") && payload.get("amount") != null) {
            amount = new BigDecimal(payload.get("amount").toString());
        }
        String paymentMethod = (String) payload.getOrDefault("paymentMethod", "ACCOUNT_CREDIT");
        String notes = (String) payload.getOrDefault("notes", "");

        return ResponseEntity.ok(logisticsService.confirmDelivery(id, amount, paymentMethod, notes));
    }
}
