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

    @PutMapping("/suppliers/{id}")
    @Operation(summary = "Modificar datos de un proveedor")
    public ResponseEntity<SupplierDto> updateSupplier(@PathVariable java.util.UUID id, @Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.ok(supplyService.updateSupplier(id, request));
    }

    @PatchMapping("/suppliers/{id}/status")
    @Operation(summary = "Inhabilitar o habilitar un proveedor")
    public ResponseEntity<Void> toggleSupplierStatus(@PathVariable java.util.UUID id, @RequestBody java.util.Map<String, Boolean> payload) {
        supplyService.toggleSupplierStatus(id, payload.get("isActive"));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/materials/{id}")
    @Operation(summary = "Modificar stock o precio de una materia prima")
    public ResponseEntity<RawMaterialStockDto> updateMaterial(
            @PathVariable java.util.UUID id,
            @RequestBody java.util.Map<String, Object> payload) {
        java.math.BigDecimal stock = payload.get("stock") != null ? new java.math.BigDecimal(payload.get("stock").toString()) : null;
        java.math.BigDecimal price = payload.get("price") != null ? new java.math.BigDecimal(payload.get("price").toString()) : null;
        java.math.BigDecimal minStock = payload.get("minimumStock") != null ? new java.math.BigDecimal(payload.get("minimumStock").toString()) : null;
        return ResponseEntity.ok(supplyService.updateRawMaterial(id, stock, price, minStock));
    }

    @PostMapping("/materials")
    @Operation(summary = "Crear nueva materia prima en catálogo")
    public ResponseEntity<RawMaterialStockDto> createMaterial(@RequestBody java.util.Map<String, Object> payload) {
        String code = (String) payload.get("code");
        String name = (String) payload.get("name");
        String category = (String) payload.get("category");
        String unit = (String) payload.get("unitOfMeasure");
        java.math.BigDecimal stock = payload.get("currentStock") != null ? new java.math.BigDecimal(payload.get("currentStock").toString()) : java.math.BigDecimal.ZERO;
        java.math.BigDecimal minStock = payload.get("minimumStock") != null ? new java.math.BigDecimal(payload.get("minimumStock").toString()) : java.math.BigDecimal.valueOf(10);
        java.math.BigDecimal price = payload.get("lastPurchasePrice") != null ? new java.math.BigDecimal(payload.get("lastPurchasePrice").toString()) : java.math.BigDecimal.ZERO;
        return ResponseEntity.status(HttpStatus.CREATED).body(supplyService.createRawMaterial(code, name, category, unit, stock, minStock, price));
    }

    @PatchMapping("/materials/{id}/status")
    @Operation(summary = "Inhabilitar o habilitar una materia prima")
    public ResponseEntity<Void> toggleMaterialStatus(@PathVariable java.util.UUID id, @RequestBody java.util.Map<String, Boolean> payload) {
        supplyService.toggleRawMaterialStatus(id, payload.get("isActive"));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/purchases/{id}")
    @Operation(summary = "Eliminar o anular una factura de compra")
    public ResponseEntity<Void> deletePurchase(@PathVariable java.util.UUID id) {
        supplyService.deletePurchase(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/planning")
    @Operation(summary = "Asistente de Planificación de Compras Matutino según Demanda JIT (US-07)")
    public ResponseEntity<SupplyPlanningDto> getSupplyPlanning() {
        return ResponseEntity.ok(supplyService.getSupplyPlanning());
    }
}
