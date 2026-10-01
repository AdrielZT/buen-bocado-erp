package com.buenbocado.erp.controller;

import com.buenbocado.erp.dto.supply.*;
import com.buenbocado.erp.service.SupplyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/supplies")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supplies & Procurement", description = "Endpoints para Compras, Proveedores e Inventario de Insumos (Módulo 4 US-07 y US-08)")
public class SupplyController {

    private final SupplyService supplyService;

    @GetMapping("/materials")
    @Operation(summary = "Obtener inventario actual de materias primas e insumos en cámara de frío")
    public ResponseEntity<List<RawMaterialStockDto>> getRawMaterials() {
        return ResponseEntity.ok(supplyService.getRawMaterialsStock());
    }

    @GetMapping("/suppliers")
    @Operation(summary = "Listar proveedores activos de la fábrica")
    public ResponseEntity<List<SupplierDto>> getSuppliers() {
        return ResponseEntity.ok(supplyService.getAllSuppliers());
    }

    @PostMapping("/suppliers")
    @Operation(summary = "Dar de alta un nuevo proveedor")
    public ResponseEntity<SupplierDto> createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplyService.createSupplier(request));
    }

    @GetMapping("/purchases")
    @Operation(summary = "Consultar historial de facturas y compras de insumos con filtro opcional de fechas")
    public ResponseEntity<List<PurchaseInvoiceDto>> getPurchases(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate
    ) {
        return ResponseEntity.ok(supplyService.getPurchases(startDate, endDate));
    }

    @PostMapping("/purchases")
    @Operation(summary = "Registrar compra de insumos, ingresando stock y actualizando precios PEPS")
    public ResponseEntity<PurchaseInvoiceDto> registerPurchase(@Valid @RequestBody RegisterPurchaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplyService.registerPurchase(request));
    }

    @GetMapping("/planning")
    @Operation(summary = "Asistente de Planificación de Compras Matutino según Demanda JIT (US-07)")
    public ResponseEntity<SupplyPlanningDto> getSupplyPlanning() {
        return ResponseEntity.ok(supplyService.getSupplyPlanning());
    }
}
