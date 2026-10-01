package com.buenbocado.erp.controller;

import com.buenbocado.erp.dto.finance.*;
import com.buenbocado.erp.model.entity.*;
import com.buenbocado.erp.repository.*;
import com.buenbocado.erp.service.FinanceAnalyticsEngineService;
import com.buenbocado.erp.service.PoiExcelExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
@Tag(name = "Finance & BI Engine", description = "Endpoints de cálculo financiero, EBITDA, NOF, Devoluciones y Ventas")
public class FinanceController {

    private final FinanceAnalyticsEngineService analyticsService;
    private final PoiExcelExportService excelService;
    private final OperatingExpenseRepository expenseRepository;
    private final ClientRepository clientRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderReturnRepository returnRepository;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    @Operation(summary = "Obtener métricas financieras en tiempo real (EBITDA, NOF, Margen, Punto de Equilibrio)")
    public ResponseEntity<FinanceDashboardDto> getFinanceDashboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        FinanceDashboardDto dashboard = analyticsService.calculateDashboard(startDate, endDate);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/export/excel")
    @Operation(summary = "Descarga de reporte Excel (.xlsx) con Apache POI Streaming (SXSSF)")
    public ResponseEntity<byte[]> exportFinanceExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) throws IOException {
        FinanceDashboardDto dashboard = analyticsService.calculateDashboard(startDate, endDate);
        byte[] excelBytes = excelService.exportFinanceDashboardToExcel(dashboard);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=buen_bocado_financiero_" + startDate + "_" + endDate + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @GetMapping("/clients")
    @Operation(summary = "Listar clientes para selección rápida en ventas y devoluciones")
    public ResponseEntity<List<Client>> getClients() {
        return ResponseEntity.ok(clientRepository.findAll());
    }

    @PostMapping("/clients")
    @Operation(summary = "Dar de alta un nuevo cliente comercial")
    public ResponseEntity<Client> createClient(@RequestBody Client client) {
        if (client.getId() == null) {
            client.setId(UUID.randomUUID());
        }
        if (client.getCreditLimit() == null) {
            client.setCreditLimit(BigDecimal.valueOf(150000));
        }
        if (client.getCurrentBalance() == null) {
            client.setCurrentBalance(BigDecimal.ZERO);
        }
        if (client.getClientType() == null) {
            client.setClientType("B2B_KIOSK");
        }
        client.setIsActive(true);
        return ResponseEntity.ok(clientRepository.save(client));
    }

    @PostMapping("/clients/{id}/payments")
    @Operation(summary = "Registrar cobranza / pago a cuenta corriente de cliente")
    public ResponseEntity<Client> registerPayment(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Object> paymentData) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado con ID: " + id));
        BigDecimal amount = BigDecimal.ZERO;
        if (paymentData.containsKey("amount") && paymentData.get("amount") != null) {
            amount = new BigDecimal(paymentData.get("amount").toString());
        }
        BigDecimal current = client.getCurrentBalance() != null ? client.getCurrentBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = current.subtract(amount);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            newBalance = BigDecimal.ZERO;
        }
        client.setCurrentBalance(newBalance);
        return ResponseEntity.ok(clientRepository.save(client));
    }

    @GetMapping("/products")
    @Operation(summary = "Listar productos activos para selección rápida")
    public ResponseEntity<List<Product>> getProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @GetMapping("/expenses")
    @Operation(summary = "Listar gastos operativos del período")
    public ResponseEntity<List<OperatingExpense>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(expenseRepository.findByExpenseDateBetween(startDate, endDate));
        }
        return ResponseEntity.ok(expenseRepository.findAll());
    }

    @PostMapping("/expenses")
    @Operation(summary = "Registrar un nuevo gasto operativo (fijo o variable)")
    public ResponseEntity<OperatingExpense> createExpense(@Valid @RequestBody OperatingExpenseRequestDto request) {
        OperatingExpense expense = OperatingExpense.builder()
                .expenseDate(request.getExpenseDate())
                .category(request.getCategory().toUpperCase())
                .concept(request.getConcept())
                .amount(request.getAmount())
                .isFixedCost(request.getIsFixedCost() != null ? request.getIsFixedCost() : true)
                .voucherNumber(request.getVoucherNumber())
                .voucherUrl(request.getVoucherUrl())
                .build();
        return ResponseEntity.ok(expenseRepository.save(expense));
    }

    @DeleteMapping("/expenses/{id}")
    @Operation(summary = "Eliminar un gasto operativo por ID")
    public ResponseEntity<Void> deleteExpense(@PathVariable UUID id) {
        expenseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/expenses/batch-delete")
    @Operation(summary = "Eliminar múltiples gastos operativos en lote")
    public ResponseEntity<Void> deleteExpensesBatch(@RequestBody List<UUID> ids) {
        if (ids != null && !ids.isEmpty()) {
            expenseRepository.deleteAllById(ids);
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/clients/{id}")
    @Operation(summary = "Modificar datos de un cliente comercial")
    public ResponseEntity<Client> updateClient(@PathVariable UUID id, @RequestBody Client updated) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        if (updated.getBusinessName() != null) client.setBusinessName(updated.getBusinessName());
        if (updated.getContactName() != null) client.setContactName(updated.getContactName());
        if (updated.getTaxId() != null) client.setTaxId(updated.getTaxId());
        if (updated.getPhone() != null) client.setPhone(updated.getPhone());
        if (updated.getEmail() != null) client.setEmail(updated.getEmail());
        if (updated.getDeliveryAddress() != null) client.setDeliveryAddress(updated.getDeliveryAddress());
        if (updated.getCreditLimit() != null) client.setCreditLimit(updated.getCreditLimit());
        if (updated.getClientType() != null) client.setClientType(updated.getClientType());
        if (updated.getIsActive() != null) client.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(clientRepository.save(client));
    }

    @PatchMapping("/clients/{id}/status")
    @Operation(summary = "Inhabilitar o habilitar un cliente comercial")
    public ResponseEntity<Client> toggleClientStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, Boolean> payload) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        boolean active = payload.getOrDefault("isActive", !Boolean.TRUE.equals(client.getIsActive()));
        client.setIsActive(active);
        return ResponseEntity.ok(clientRepository.save(client));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Modificar un producto elaborado, reventa o combo")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID id, @RequestBody Product updated) {
        Product prod = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + id));
        if (updated.getName() != null) prod.setName(updated.getName());
        if (updated.getSku() != null) prod.setSku(updated.getSku());
        if (updated.getCategory() != null) prod.setCategory(updated.getCategory());
        if (updated.getBaseUnitPrice() != null) prod.setBaseUnitPrice(updated.getBaseUnitPrice());
        if (updated.getShelfLifeHours() != null) prod.setShelfLifeHours(updated.getShelfLifeHours());
        if (updated.getIsActive() != null) prod.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(productRepository.save(prod));
    }

    @PatchMapping("/products/{id}/status")
    @Operation(summary = "Inhabilitar o activar un producto comercial")
    public ResponseEntity<Product> toggleProductStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, Boolean> payload) {
        Product prod = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + id));
        boolean active = payload.getOrDefault("isActive", !Boolean.TRUE.equals(prod.getIsActive()));
        prod.setIsActive(active);
        return ResponseEntity.ok(productRepository.save(prod));
    }

    @DeleteMapping("/orders/{id}")
    @Operation(summary = "Eliminar o anular una orden de venta")
    public ResponseEntity<Void> deleteOrder(@PathVariable UUID id) {
        orderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/orders")
    @Operation(summary = "Registrar una nueva venta / pedido manual con precio pactado por cliente")
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequestDto request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        User defaultSeller = userRepository.findAll().stream().findFirst().orElse(null);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        UUID orderId = UUID.randomUUID();

        Order order = Order.builder()
                .id(orderId)
                .client(client)
                .seller(defaultSeller)
                .channel(request.getChannel() != null ? request.getChannel() : "B2B_STREET")
                .status("DELIVERED")
                .deliveryDate(request.getDeliveryDate())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "ACCOUNT_CREDIT")
                .createdAt(Instant.now())
                .build();

        for (var itemReq : request.getItems()) {
            Product prod = productRepository.findById(itemReq.getProductId()).orElse(null);
            BigDecimal itemTotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            // CMV estimado ~42% del precio base
            BigDecimal unitCmv = (prod != null && prod.getBaseUnitPrice() != null)
                    ? prod.getBaseUnitPrice().multiply(new BigDecimal("0.42"))
                    : itemReq.getUnitPrice().multiply(new BigDecimal("0.42"));

            items.add(OrderItem.builder()
                    .id(UUID.randomUUID())
                    .order(order)
                    .productId(itemReq.getProductId())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .unitCostCmv(unitCmv)
                    .totalPrice(itemTotal)
                    .build());
        }

        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal);
        order.setItems(items);

        return ResponseEntity.ok(orderRepository.save(order));
    }

    @PostMapping("/returns")
    @Operation(summary = "Registrar una devolución / merma de cliente")
    public ResponseEntity<OrderReturn> createReturn(@Valid @RequestBody CreateReturnRequestDto request) {
        Product prod = productRepository.findById(request.getProductId()).orElse(null);

        BigDecimal unitPrice = prod != null ? prod.getBaseUnitPrice() : new BigDecimal("1500.00");
        BigDecimal credited = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal loss = credited.multiply(new BigDecimal("0.42")); // Costo real perdido

        OrderReturn orderReturn = OrderReturn.builder()
                .id(UUID.randomUUID())
                .clientId(request.getClientId())
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .creditedAmount(credited)
                .lossAmount(loss)
                .reason(request.getReason() != null ? request.getReason() : "EXPIRED_FROZEN")
                .createdAt(Instant.now())
                .build();

        return ResponseEntity.ok(returnRepository.save(orderReturn));
    }

    @DeleteMapping("/returns/{id}")
    @Operation(summary = "Eliminar un registro de devolución")
    public ResponseEntity<Void> deleteReturn(@PathVariable UUID id) {
        returnRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
