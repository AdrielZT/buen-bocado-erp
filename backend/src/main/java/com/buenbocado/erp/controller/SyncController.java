package com.buenbocado.erp.controller;

import com.buenbocado.erp.dto.sync.SyncPushRequest;
import com.buenbocado.erp.dto.sync.SyncPushResponse;
import com.buenbocado.erp.model.entity.Order;
import com.buenbocado.erp.repository.OrderRepository;
import com.buenbocado.erp.service.SyncEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@Tag(name = "Sync Engine", description = "Endpoints para sincronización Offline-First bidireccional")
public class SyncController {

    private final SyncEngineService syncEngineService;
    private final OrderRepository orderRepository;

    @PostMapping("/push")
    @Operation(summary = "Recepción de lote de mutaciones offline con claves de idempotencia")
    public ResponseEntity<SyncPushResponse> pushMutations(@RequestBody SyncPushRequest request) {
        SyncPushResponse response = syncEngineService.processPushBatch(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pull")
    @Operation(summary = "Descarga de novedades (deltas) a partir de una secuencia del servidor")
    public ResponseEntity<List<Order>> pullDeltas(@RequestParam(defaultValue = "0") Long sinceSequenceId) {
        List<Order> deltas = orderRepository.findDeltasSince(sinceSequenceId);
        return ResponseEntity.ok(deltas);
    }
}
