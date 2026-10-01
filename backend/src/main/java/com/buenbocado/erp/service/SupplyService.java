package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.supply.*;
import com.buenbocado.erp.model.entity.PurchaseInvoice;
import com.buenbocado.erp.model.entity.PurchaseItem;
import com.buenbocado.erp.model.entity.RawMaterial;
import com.buenbocado.erp.model.entity.Supplier;
import com.buenbocado.erp.repository.PurchaseInvoiceRepository;
import com.buenbocado.erp.repository.PurchaseItemRepository;
import com.buenbocado.erp.repository.RawMaterialRepository;
import com.buenbocado.erp.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplyService {

    private final SupplierRepository supplierRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final PurchaseItemRepository purchaseItemRepository;

    @Transactional(readOnly = true)
    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findByIsActiveTrueOrderByBusinessNameAsc().stream()
                .map(s -> SupplierDto.builder()
                        .id(s.getId())
                        .businessName(s.getBusinessName())
                        .taxId(s.getTaxId())
                        .contactPhone(s.getContactPhone())
                        .email(s.getEmail())
                        .isActive(s.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierDto createSupplier(CreateSupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .businessName(request.getBusinessName().trim())
                .taxId(request.getTaxId() != null ? request.getTaxId().trim() : null)
                .contactPhone(request.getContactPhone() != null ? request.getContactPhone().trim() : null)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .isActive(true)
                .build();

        Supplier saved = supplierRepository.save(supplier);
        log.info("Proveedor creado exitosamente: {} con ID {}", saved.getBusinessName(), saved.getId());

        return SupplierDto.builder()
                .id(saved.getId())
                .businessName(saved.getBusinessName())
                .taxId(saved.getTaxId())
                .contactPhone(saved.getContactPhone())
                .email(saved.getEmail())
                .isActive(saved.getIsActive())
                .build();
    }

    @Transactional(readOnly = true)
    public List<RawMaterialStockDto> getRawMaterialsStock() {
        List<RawMaterial> materials = rawMaterialRepository.findAll();
        return materials.stream()
                .map(m -> {
                    BigDecimal current = m.getCurrentStock() != null ? m.getCurrentStock() : BigDecimal.ZERO;
                    BigDecimal min = m.getMinimumStock() != null ? m.getMinimumStock() : BigDecimal.ZERO;
                    BigDecimal price = m.getLastPurchasePrice() != null ? m.getLastPurchasePrice() : BigDecimal.ZERO;
                    BigDecimal val = current.multiply(price).setScale(2, RoundingMode.HALF_UP);

                    String status = "OPTIMO";
                    if (current.compareTo(min) <= 0) {
                        status = "CRITICO";
                    } else if (current.compareTo(min.multiply(BigDecimal.valueOf(1.3))) <= 0) {
                        status = "ADVERTENCIA";
                    }

                    BigDecimal target = min.multiply(BigDecimal.valueOf(2.5));
                    BigDecimal suggested = target.subtract(current);
                    if (suggested.compareTo(BigDecimal.ZERO) < 0) {
                        suggested = BigDecimal.ZERO;
                    }

                    return RawMaterialStockDto.builder()
                            .id(m.getId())
                            .code(m.getCode())
                            .name(m.getName())
                            .category(m.getCategory())
                            .unitOfMeasure(m.getUnitOfMeasure())
                            .currentStock(current)
                            .minimumStock(min)
                            .lastPurchasePrice(price)
                            .totalValue(val)
                            .stockStatus(status)
                            .suggestedReorderQty(suggested.setScale(2, RoundingMode.HALF_UP))
                            .build();
                })
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .collect(Collectors.toList());
    }

    @Transactional
    public PurchaseInvoiceDto registerPurchase(RegisterPurchaseRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado con ID: " + request.getSupplierId()));

        BigDecimal totalInvoice = BigDecimal.ZERO;
        for (RegisterPurchaseRequest.PurchaseItemLineRequest itemReq : request.getItems()) {
            BigDecimal lineTotal = itemReq.getQuantity().multiply(itemReq.getUnitPrice());
            totalInvoice = totalInvoice.add(lineTotal);
        }

        PurchaseInvoice invoice = PurchaseInvoice.builder()
                .supplier(supplier)
                .invoiceNumber(request.getInvoiceNumber() != null ? request.getInvoiceNumber().trim() : "FAC-" + System.currentTimeMillis() % 100000)
                .invoiceDate(request.getInvoiceDate())
                .totalAmount(totalInvoice.setScale(2, RoundingMode.HALF_UP))
                .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "PAID")
                .items(new ArrayList<>())
                .build();

        List<PurchaseItem> items = new ArrayList<>();
        List<PurchaseItemDto> itemDtos = new ArrayList<>();

        for (RegisterPurchaseRequest.PurchaseItemLineRequest itemReq : request.getItems()) {
            RawMaterial material = rawMaterialRepository.findById(itemReq.getRawMaterialId())
                    .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado con ID: " + itemReq.getRawMaterialId()));

            // Actualizar stock e incrementar con la compra
            BigDecimal current = material.getCurrentStock() != null ? material.getCurrentStock() : BigDecimal.ZERO;
            material.setCurrentStock(current.add(itemReq.getQuantity()));
            // Actualizar último precio de compra para costeo PEPS / JIT
            material.setLastPurchasePrice(itemReq.getUnitPrice());
            rawMaterialRepository.save(material);

            BigDecimal lineTotal = itemReq.getQuantity().multiply(itemReq.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);

            PurchaseItem item = PurchaseItem.builder()
                    .purchaseInvoice(invoice)
                    .rawMaterial(material)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(lineTotal)
                    .build();

            items.add(item);

            itemDtos.add(PurchaseItemDto.builder()
                    .rawMaterialId(material.getId())
                    .rawMaterialCode(material.getCode())
                    .rawMaterialName(material.getName())
                    .unitOfMeasure(material.getUnitOfMeasure())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(lineTotal)
                    .build());
        }

        invoice.setItems(items);
        PurchaseInvoice saved = purchaseInvoiceRepository.save(invoice);
        log.info("Factura de compra registrada #{} de {} por un total de ${}",
                saved.getInvoiceNumber(), supplier.getBusinessName(), saved.getTotalAmount());

        return PurchaseInvoiceDto.builder()
                .id(saved.getId())
                .supplierId(supplier.getId())
                .supplierName(supplier.getBusinessName())
                .invoiceNumber(saved.getInvoiceNumber())
                .invoiceDate(saved.getInvoiceDate())
                .totalAmount(saved.getTotalAmount())
                .paymentStatus(saved.getPaymentStatus())
                .items(itemDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PurchaseInvoiceDto> getPurchases(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        List<PurchaseInvoice> list;
        if (startDate != null && endDate != null) {
            list = purchaseInvoiceRepository.findByInvoiceDateBetweenWithDetails(startDate, endDate);
        } else {
            list = purchaseInvoiceRepository.findAllWithDetails();
        }
        return list.stream()
                .map(inv -> PurchaseInvoiceDto.builder()
                        .id(inv.getId())
                        .supplierId(inv.getSupplier() != null ? inv.getSupplier().getId() : null)
                        .supplierName(inv.getSupplier() != null ? inv.getSupplier().getBusinessName() : "Proveedor General")
                        .invoiceNumber(inv.getInvoiceNumber())
                        .invoiceDate(inv.getInvoiceDate())
                        .totalAmount(inv.getTotalAmount())
                        .paymentStatus(inv.getPaymentStatus())
                        .items(inv.getItems().stream().map(it -> PurchaseItemDto.builder()
                                .id(it.getId())
                                .rawMaterialId(it.getRawMaterial() != null ? it.getRawMaterial().getId() : null)
                                .rawMaterialCode(it.getRawMaterial() != null ? it.getRawMaterial().getCode() : "-")
                                .rawMaterialName(it.getRawMaterial() != null ? it.getRawMaterial().getName() : "Insumo")
                                .unitOfMeasure(it.getRawMaterial() != null ? it.getRawMaterial().getUnitOfMeasure() : "u")
                                .quantity(it.getQuantity())
                                .unitPrice(it.getUnitPrice())
                                .totalPrice(it.getTotalPrice())
                                .build()).collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplyPlanningDto getSupplyPlanning() {
        List<RawMaterial> materials = rawMaterialRepository.findAll();
        List<SupplyPlanningDto.MaterialPlanningItem> items = new ArrayList<>();
        BigDecimal totalEstCost = BigDecimal.ZERO;
        long alertCount = 0;

        for (RawMaterial m : materials) {
            BigDecimal current = m.getCurrentStock() != null ? m.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal min = m.getMinimumStock() != null ? m.getMinimumStock() : BigDecimal.ZERO;
            BigDecimal price = m.getLastPurchasePrice() != null ? m.getLastPurchasePrice() : BigDecimal.ZERO;

            // Demanda estimada basada en producción JIT habitual (un 50% de rotación diaria)
            BigDecimal pendingReq = min.multiply(BigDecimal.valueOf(0.6)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal safetyStockTarget = min.multiply(BigDecimal.valueOf(1.8)).setScale(2, RoundingMode.HALF_UP);

            BigDecimal needed = safetyStockTarget.subtract(current);
            if (needed.compareTo(BigDecimal.ZERO) < 0) {
                needed = BigDecimal.ZERO;
            }

            BigDecimal estCost = needed.multiply(price).setScale(2, RoundingMode.HALF_UP);
            totalEstCost = totalEstCost.add(estCost);

            String urgency = "BAJA";
            if (current.compareTo(min) <= 0) {
                urgency = "ALTA";
                alertCount++;
            } else if (current.compareTo(min.multiply(BigDecimal.valueOf(1.25))) <= 0) {
                urgency = "MEDIA";
                alertCount++;
            }

            items.add(SupplyPlanningDto.MaterialPlanningItem.builder()
                    .rawMaterialCode(m.getCode())
                    .rawMaterialName(m.getName())
                    .unitOfMeasure(m.getUnitOfMeasure())
                    .currentStock(current)
                    .minimumStock(min)
                    .requiredForPendingOrders(pendingReq)
                    .suggestedPurchaseQty(needed)
                    .estimatedUnitCost(price)
                    .estimatedTotalCost(estCost)
                    .urgency(urgency)
                    .build());
        }

        return SupplyPlanningDto.builder()
                .totalEstimatedPurchasesCost(totalEstCost)
                .totalMaterialsAlert(alertCount)
                .planningItems(items)
                .build();
    }
}
