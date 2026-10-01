package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.finance.*;
import com.buenbocado.erp.model.entity.*;
import com.buenbocado.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceAnalyticsEngineService {

    private final OrderRepository orderRepository;
    private final OperatingExpenseRepository expenseRepository;
    private final ProductRepository productRepository;
    private final ClientRepository clientRepository;
    private final OrderReturnRepository returnRepository;

    @Transactional(readOnly = true)
    public FinanceDashboardDto calculateDashboard(LocalDate startDate, LocalDate endDate) {
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> {
                    LocalDate d = o.getDeliveryDate() != null ? o.getDeliveryDate() : (o.getCreatedAt() != null ? LocalDate.ofInstant(o.getCreatedAt(), ZoneId.systemDefault()) : null);
                    return d != null && !d.isBefore(startDate) && !d.isAfter(endDate);
                })
                .collect(Collectors.toList());
        Map<UUID, Product> productsMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<UUID, Client> clientsMap = clientRepository.findAll().stream()
                .collect(Collectors.toMap(Client::getId, c -> c, (a, b) -> a));

        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal totalCmv = BigDecimal.ZERO;
        int totalUnitsSoldAllProducts = 0;

        // Variables de agregación de insumos BOM
        BigDecimal qtyPanPebete = BigDecimal.ZERO;
        BigDecimal qtyPanMiga = BigDecimal.ZERO;
        BigDecimal qtyJamon = BigDecimal.ZERO;
        BigDecimal qtyQueso = BigDecimal.ZERO;
        BigDecimal qtySalame = BigDecimal.ZERO;
        BigDecimal qtyCarne = BigDecimal.ZERO;
        BigDecimal qtyMayonesa = BigDecimal.ZERO;
        BigDecimal qtyPackaging = BigDecimal.ZERO;
        BigDecimal qtyEspecias = BigDecimal.ZERO;
        BigDecimal qtyAceite = BigDecimal.ZERO;

        Map<UUID, Integer> productUnitsSoldMap = new HashMap<>();
        Map<UUID, BigDecimal> productSalesAmountMap = new HashMap<>();

        List<SalesOrderBreakdownDto> salesOrdersBreakdown = new ArrayList<>();

        for (Order o : orders) {
            grossSales = grossSales.add(o.getTotalAmount());
            int orderUnits = 0;
            List<String> itemsSummaryList = new ArrayList<>();
            List<SalesOrderItemDetailDto> itemsDetailList = new ArrayList<>();

            for (OrderItem item : o.getItems()) {
                BigDecimal itemCmv = item.getUnitCostCmv().multiply(BigDecimal.valueOf(item.getQuantity()));
                totalCmv = totalCmv.add(itemCmv);
                orderUnits += item.getQuantity();
                totalUnitsSoldAllProducts += item.getQuantity();

                UUID pid = item.getProductId();
                Product prod = productsMap.get(pid);
                String pName = prod != null ? prod.getName() : "Sándwich";
                String pCat = prod != null ? prod.getCategory() : "GENERAL";
                String sku = prod != null && prod.getSku() != null ? prod.getSku() : "";

                productUnitsSoldMap.put(pid, productUnitsSoldMap.getOrDefault(pid, 0) + item.getQuantity());
                productSalesAmountMap.put(pid, productSalesAmountMap.getOrDefault(pid, BigDecimal.ZERO).add(item.getTotalPrice()));

                // Subtotal del ítem en la orden y porcentaje sobre la orden
                BigDecimal subtotal = item.getTotalPrice();
                BigDecimal pctOfOrder = o.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                        ? subtotal.divide(o.getTotalAmount(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                        : BigDecimal.ZERO;

                itemsSummaryList.add(item.getQuantity() + "x " + pName + " @ $" + item.getUnitPrice().setScale(0, RoundingMode.HALF_UP));

                itemsDetailList.add(SalesOrderItemDetailDto.builder()
                        .productId(pid)
                        .productName(pName)
                        .productCategory(pCat)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(subtotal)
                        .percentOfOrder(pctOfOrder.setScale(2, RoundingMode.HALF_UP))
                        .build());

                // Deducción de insumos según receta (BOM)
                int q = item.getQuantity();
                BigDecimal qBd = BigDecimal.valueOf(q);

                if (sku.contains("PEB-JYQ") || (pName.toLowerCase().contains("peb") && pName.toLowerCase().contains("jam"))) {
                    qtyPanPebete = qtyPanPebete.add(qBd);
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.050")));
                    qtyJamon = qtyJamon.add(qBd.multiply(new BigDecimal("0.045")));
                    qtyMayonesa = qtyMayonesa.add(qBd.multiply(new BigDecimal("0.010")));
                    qtyPackaging = qtyPackaging.add(qBd);
                    qtyEspecias = qtyEspecias.add(qBd.multiply(new BigDecimal("0.004")));
                } else if (sku.contains("PEB-SYQ") || (pName.toLowerCase().contains("peb") && pName.toLowerCase().contains("salame"))) {
                    qtyPanPebete = qtyPanPebete.add(qBd);
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.050")));
                    qtySalame = qtySalame.add(qBd.multiply(new BigDecimal("0.050")));
                    qtyPackaging = qtyPackaging.add(qBd);
                    qtyEspecias = qtyEspecias.add(qBd.multiply(new BigDecimal("0.005")));
                } else if (sku.contains("PEB-TER") || (pName.toLowerCase().contains("peb") && pName.toLowerCase().contains("ter"))) {
                    qtyPanPebete = qtyPanPebete.add(qBd);
                    qtyCarne = qtyCarne.add(qBd.multiply(new BigDecimal("0.090")));
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.050")));
                    qtyMayonesa = qtyMayonesa.add(qBd.multiply(new BigDecimal("0.010")));
                    qtyPackaging = qtyPackaging.add(qBd);
                } else if (sku.contains("MIL-COM") || pName.toLowerCase().contains("milanesa")) {
                    qtyPanPebete = qtyPanPebete.add(qBd);
                    qtyCarne = qtyCarne.add(qBd.multiply(new BigDecimal("0.160")));
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.050")));
                    qtyJamon = qtyJamon.add(qBd.multiply(new BigDecimal("0.040")));
                    qtyMayonesa = qtyMayonesa.add(qBd.multiply(new BigDecimal("0.020")));
                    qtyAceite = qtyAceite.add(qBd.multiply(new BigDecimal("0.015")));
                    qtyPackaging = qtyPackaging.add(qBd);
                } else if (sku.contains("MIG-TER") || (pName.toLowerCase().contains("miga") && pName.toLowerCase().contains("ter"))) {
                    qtyPanMiga = qtyPanMiga.add(qBd.multiply(new BigDecimal("0.180")));
                    qtyCarne = qtyCarne.add(qBd.multiply(new BigDecimal("0.080")));
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.050")));
                    qtyMayonesa = qtyMayonesa.add(qBd.multiply(new BigDecimal("0.020")));
                    qtyPackaging = qtyPackaging.add(qBd);
                } else if (sku.contains("MIG-SYQ") || (pName.toLowerCase().contains("miga") && pName.toLowerCase().contains("sal"))) {
                    qtyPanMiga = qtyPanMiga.add(qBd.multiply(new BigDecimal("0.180")));
                    qtySalame = qtySalame.add(qBd.multiply(new BigDecimal("0.060")));
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.060")));
                    qtyPackaging = qtyPackaging.add(qBd);
                } else if (sku.contains("MIG-JYQ") || pName.toLowerCase().contains("miga")) {
                    qtyPanMiga = qtyPanMiga.add(qBd.multiply(new BigDecimal("0.180")));
                    qtyJamon = qtyJamon.add(qBd.multiply(new BigDecimal("0.070")));
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.075")));
                    qtyMayonesa = qtyMayonesa.add(qBd.multiply(new BigDecimal("0.025")));
                    qtyPackaging = qtyPackaging.add(qBd);
                } else {
                    qtyPackaging = qtyPackaging.add(qBd);
                    qtyPanPebete = qtyPanPebete.add(qBd);
                    qtyQueso = qtyQueso.add(qBd.multiply(new BigDecimal("0.050")));
                    qtyJamon = qtyJamon.add(qBd.multiply(new BigDecimal("0.050")));
                }
            }

            LocalDate oDate = o.getDeliveryDate() != null ? o.getDeliveryDate() : startDate;
            String clientName = o.getClient() != null ? o.getClient().getBusinessName() : "Cliente General";
            String clientType = o.getClient() != null ? o.getClient().getClientType() : "B2B";

            salesOrdersBreakdown.add(SalesOrderBreakdownDto.builder()
                    .orderId(o.getId())
                    .orderDate(oDate)
                    .clientName(clientName)
                    .clientType(clientType)
                    .totalAmount(o.getTotalAmount())
                    .totalUnits(orderUnits)
                    .productsSummary(String.join(" | ", itemsSummaryList))
                    .items(itemsDetailList)
                    .build());
        }

        // ================= GESTIÓN DE DEVOLUCIONES DE CLIENTES =================
        List<OrderReturn> allReturns = returnRepository.findAll().stream()
                .filter(ret -> {
                    LocalDate rDate = ret.getCreatedAt() != null
                            ? LocalDate.ofInstant(ret.getCreatedAt(), ZoneId.systemDefault())
                            : startDate;
                    return !rDate.isBefore(startDate) && !rDate.isAfter(endDate);
                })
                .collect(Collectors.toList());
        BigDecimal totalReturnsAmount = BigDecimal.ZERO;
        int totalReturnsUnits = 0;
        List<ReturnItemDto> returnsBreakdown = new ArrayList<>();

        for (OrderReturn ret : allReturns) {
            totalReturnsAmount = totalReturnsAmount.add(ret.getCreditedAmount());
            totalReturnsUnits += ret.getQuantity();

            Client cl = clientsMap.get(ret.getClientId());
            Product pr = productsMap.get(ret.getProductId());
            String cName = cl != null ? cl.getBusinessName() : "Cliente";
            String pName = pr != null ? pr.getName() : "Sándwich";
            LocalDate rDate = ret.getCreatedAt() != null
                    ? LocalDate.ofInstant(ret.getCreatedAt(), ZoneId.systemDefault())
                    : startDate;

            returnsBreakdown.add(ReturnItemDto.builder()
                    .id(ret.getId())
                    .returnDate(rDate)
                    .clientName(cName)
                    .productName(pName)
                    .quantity(ret.getQuantity())
                    .creditedAmount(ret.getCreditedAmount())
                    .lossAmount(ret.getLossAmount())
                    .reason(ret.getReason())
                    .build());
        }

        // ================= GESTIÓN DE VENTAS NETAS Y DEVOLUCIONES =================
        // Punto 1: Opción A - Deducción directa de devoluciones/mermas de las ventas brutas
        BigDecimal totalSales = grossSales.subtract(totalReturnsAmount);
        if (totalSales.compareTo(BigDecimal.ZERO) < 0) {
            totalSales = BigDecimal.ZERO;
        }

        BigDecimal returnRatePercent = grossSales.compareTo(BigDecimal.ZERO) > 0
                ? totalReturnsAmount.divide(grossSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        for (SalesOrderBreakdownDto s : salesOrdersBreakdown) {
            BigDecimal pct = totalSales.compareTo(BigDecimal.ZERO) > 0
                    ? s.getTotalAmount().divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            s.setPercentOfSales(pct.setScale(2, RoundingMode.HALF_UP));
        }
        salesOrdersBreakdown.sort((a, b) -> b.getOrderDate().compareTo(a.getOrderDate()));

        // ================= CONSTRUCCIÓN DEL DESGLOSE DE CMV POR INSUMO =================
        BigDecimal costPanPebete = qtyPanPebete.multiply(new BigDecimal("180.00"));
        BigDecimal costPanMiga = qtyPanMiga.multiply(new BigDecimal("1400.00"));
        BigDecimal costJamon = qtyJamon.multiply(new BigDecimal("4200.00"));
        BigDecimal costSalame = qtySalame.multiply(new BigDecimal("4800.00"));
        BigDecimal costQueso = qtyQueso.multiply(new BigDecimal("3900.00"));
        BigDecimal costCarne = qtyCarne.multiply(new BigDecimal("5500.00"));
        BigDecimal costMayonesa = qtyMayonesa.multiply(new BigDecimal("1100.00"));
        BigDecimal costAceite = qtyAceite.multiply(new BigDecimal("1600.00"));
        BigDecimal costPackaging = qtyPackaging.multiply(new BigDecimal("35.00"));
        BigDecimal costEspecias = qtyEspecias.multiply(new BigDecimal("2500.00"));

        BigDecimal calculatedMaterialsTotal = costPanPebete.add(costPanMiga).add(costJamon).add(costSalame)
                .add(costQueso).add(costCarne).add(costMayonesa).add(costAceite).add(costPackaging).add(costEspecias);

        if (totalCmv.compareTo(BigDecimal.ZERO) == 0 && calculatedMaterialsTotal.compareTo(BigDecimal.ZERO) > 0) {
            totalCmv = calculatedMaterialsTotal;
        }

        List<MaterialCmvBreakdownDto> rawMaterialCmvBreakdown = new ArrayList<>();
        addMaterialDto(rawMaterialCmvBreakdown, "INS-PAN-PEB", "Pan de Pebete Artesanal", "PAN", "UNIDAD", qtyPanPebete, costPanPebete, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-QUE-TYB", "Queso Tybo Especial Feteado", "QUESO", "KG", qtyQueso, costQueso, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-PAN-MIG", "Pan de Miga Blanco Extra Fresco", "PAN", "KG", qtyPanMiga, costPanMiga, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-FIA-JAM", "Jamón Cocido Primera Calidad", "FIAMBRE", "KG", qtyJamon, costJamon, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-FIA-SAL", "Salame Milán Feteado", "FIAMBRE", "KG", qtySalame, costSalame, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-CAR-NAL", "Nalga y Carne Vacuna", "CARNE", "KG", qtyCarne, costCarne, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-PAC-BOL", "Bolsas y Film Descartable", "PACKAGING", "UNIDAD", qtyPackaging, costPackaging, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-ADE-MAY", "Mayonesa Artesanal Emulsionada", "ADEREZO", "LITRO", qtyMayonesa, costMayonesa, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-ACE-GIR", "Aceite de Girasol", "ACEITE", "LITRO", qtyAceite, costAceite, totalCmv, totalSales);
        addMaterialDto(rawMaterialCmvBreakdown, "INS-ESP-VAR", "Especias, Condimentos y Sal", "ESPECIAS", "KG", qtyEspecias, costEspecias, totalCmv, totalSales);

        rawMaterialCmvBreakdown.sort((a, b) -> b.getTotalCost().compareTo(a.getTotalCost()));

        // ================= CONSOLIDACIÓN DE GASTOS OPERATIVOS SEMIFIJOS =================
        BigDecimal grossProfit = totalSales.subtract(totalCmv);
        BigDecimal grossMarginPercent = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        List<OperatingExpense> periodExpenses = expenseRepository.findByExpenseDateBetween(startDate, endDate);
        BigDecimal fixedExpenses = BigDecimal.ZERO;
        BigDecimal variableExpenses = BigDecimal.ZERO;
        BigDecimal totalOperatingExpenses = BigDecimal.ZERO;

        List<OperatingExpenseBreakdownDto> operatingExpensesBreakdown = new ArrayList<>();

        for (OperatingExpense exp : periodExpenses) {
            totalOperatingExpenses = totalOperatingExpenses.add(exp.getAmount());

            // Punto 3: Tratamiento de Costos Semifijos según naturaleza y sensibilidad
            String cat = exp.getCategory() != null ? exp.getCategory().toUpperCase() : "OTROS";
            BigDecimal amt = exp.getAmount();
            BigDecimal fixedPortion = BigDecimal.ZERO;
            BigDecimal variablePortion = BigDecimal.ZERO;

            switch (cat) {
                case "ALQUILER":
                    // El alquiler se mantiene constante en el mes (escalón cada 3-6 meses) -> 100% fijo mensual
                    fixedPortion = amt;
                    break;
                case "SUELDOS":
                    // Base fija de planta garantizada (80%) + porción variable por horas extra, 4/5 semanas y comisiones (20%)
                    fixedPortion = amt.multiply(new BigDecimal("0.80"));
                    variablePortion = amt.multiply(new BigDecimal("0.20"));
                    break;
                case "COMBUSTIBLE":
                    // 30% recorrido base de rutas fijas + 70% variable según volumen y puntos de entrega
                    fixedPortion = amt.multiply(new BigDecimal("0.30"));
                    variablePortion = amt.multiply(new BigDecimal("0.70"));
                    break;
                case "ENERGIA":
                case "GAS":
                    // 60% base fija de frío 24/7 en cámaras + 40% variable por cocción y ciclos de apertura
                    fixedPortion = amt.multiply(new BigDecimal("0.60"));
                    variablePortion = amt.multiply(new BigDecimal("0.40"));
                    break;
                case "PACKAGING":
                    // 100% variable por unidad producida
                    variablePortion = amt;
                    break;
                default:
                    if (Boolean.TRUE.equals(exp.getIsFixedCost())) {
                        fixedPortion = amt;
                    } else {
                        variablePortion = amt;
                    }
                    break;
            }

            fixedExpenses = fixedExpenses.add(fixedPortion);
            variableExpenses = variableExpenses.add(variablePortion);
        }

        for (OperatingExpense exp : periodExpenses) {
            BigDecimal pctParent = totalOperatingExpenses.compareTo(BigDecimal.ZERO) > 0
                    ? exp.getAmount().divide(totalOperatingExpenses, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            BigDecimal pctSales = totalSales.compareTo(BigDecimal.ZERO) > 0
                    ? exp.getAmount().divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            operatingExpensesBreakdown.add(OperatingExpenseBreakdownDto.builder()
                    .id(exp.getId())
                    .expenseDate(exp.getExpenseDate())
                    .category(exp.getCategory())
                    .concept(exp.getConcept())
                    .voucherNumber(exp.getVoucherNumber())
                    .amount(exp.getAmount())
                    .isFixedCost(exp.getIsFixedCost())
                    .percentOfExpenses(pctParent.setScale(2, RoundingMode.HALF_UP))
                    .percentOfSales(pctSales.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }
        operatingExpensesBreakdown.sort((a, b) -> b.getExpenseDate().compareTo(a.getExpenseDate()));

        // Punto 5: Margen/Resultado Operativo en lugar de EBITDA y Resultado Neto en lugar de EBIT
        BigDecimal operatingProfit = grossProfit.subtract(totalOperatingExpenses);
        BigDecimal operatingMarginPercent = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? operatingProfit.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal netProfit = operatingProfit; // En MVP base sin amortizaciones extras cargadas
        BigDecimal netMarginPercent = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal ebitda = operatingProfit;
        BigDecimal ebit = netProfit;

        BigDecimal nof = totalSales.multiply(BigDecimal.valueOf(0.20));
        BigDecimal workingCapital = nof.multiply(BigDecimal.valueOf(1.15));

        // ================= PUNTO DE EQUILIBRIO CON DOBLE FÓRMULA (PUNTO 4) =================
        // Fórmula 1: Monto a Facturar de Equilibrio ($PE)
        BigDecimal breakEvenAmount = BigDecimal.ZERO;
        if (totalSales.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal totalVariableCosts = totalCmv.add(variableExpenses);
            BigDecimal variableRatio = totalVariableCosts.divide(totalSales, 4, RoundingMode.HALF_UP);
            BigDecimal marginRatio = BigDecimal.ONE.subtract(variableRatio);
            if (marginRatio.compareTo(BigDecimal.ZERO) > 0) {
                breakEvenAmount = fixedExpenses.divide(marginRatio, 2, RoundingMode.HALF_UP);
            }
        }

        // Fórmula 2: Unidades Físicas de Equilibrio (PE Unidades)
        int totalBreakEvenUnits = 0;
        List<BreakEvenProductUnitDto> breakEvenProductBreakdown = new ArrayList<>();

        if (totalUnitsSoldAllProducts > 0 && totalSales.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal overallAveragePrice = totalSales.divide(BigDecimal.valueOf(totalUnitsSoldAllProducts), 2, RoundingMode.HALF_UP);
            if (overallAveragePrice.compareTo(BigDecimal.ZERO) > 0 && breakEvenAmount.compareTo(BigDecimal.ZERO) > 0) {
                totalBreakEvenUnits = breakEvenAmount.divide(overallAveragePrice, 0, RoundingMode.HALF_UP).intValue();

                for (Map.Entry<UUID, Integer> entry : productUnitsSoldMap.entrySet()) {
                    UUID pid = entry.getKey();
                    int unitsSold = entry.getValue();
                    Product p = productsMap.get(pid);
                    String pName = p != null ? p.getName() : "Sándwich";
                    String pCat = p != null ? p.getCategory() : "GENERAL";

                    BigDecimal volumeShare = BigDecimal.valueOf(unitsSold)
                            .divide(BigDecimal.valueOf(totalUnitsSoldAllProducts), 4, RoundingMode.HALF_UP);

                    BigDecimal productSales = productSalesAmountMap.getOrDefault(pid, BigDecimal.ZERO);
                    BigDecimal avgPrice = productSales.divide(BigDecimal.valueOf(unitsSold), 2, RoundingMode.HALF_UP);

                    int reqUnits = volumeShare.multiply(BigDecimal.valueOf(totalBreakEvenUnits)).setScale(0, RoundingMode.HALF_UP).intValue();
                    BigDecimal reqAmount = avgPrice.multiply(BigDecimal.valueOf(reqUnits));

                    breakEvenProductBreakdown.add(BreakEvenProductUnitDto.builder()
                            .productId(pid)
                            .productName(pName)
                            .category(pCat)
                            .averagePrice(avgPrice)
                            .volumeSharePercent(volumeShare.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP))
                            .requiredUnits(reqUnits)
                            .requiredSalesAmount(reqAmount)
                            .build());
                }
            }
        }
        breakEvenProductBreakdown.sort((a, b) -> b.getRequiredUnits().compareTo(a.getRequiredUnits()));

        BigDecimal avgTicket = !orders.isEmpty()
                ? totalSales.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return FinanceDashboardDto.builder()
                .startDate(startDate)
                .endDate(endDate)
                .grossSales(grossSales)
                .totalReturnsAmount(totalReturnsAmount)
                .totalReturnsUnits(totalReturnsUnits)
                .returnRatePercent(returnRatePercent.setScale(2, RoundingMode.HALF_UP))
                .totalSales(totalSales)
                .totalCmv(totalCmv)
                .grossProfit(grossProfit)
                .grossMarginPercent(grossMarginPercent)
                .fixedExpenses(fixedExpenses)
                .variableExpenses(variableExpenses)
                .totalOperatingExpenses(totalOperatingExpenses)
                .operatingProfit(operatingProfit)
                .operatingMarginPercent(operatingMarginPercent.setScale(2, RoundingMode.HALF_UP))
                .netProfit(netProfit)
                .netMarginPercent(netMarginPercent.setScale(2, RoundingMode.HALF_UP))
                .ebitda(ebitda)
                .ebit(ebit)
                .nof(nof)
                .workingCapital(workingCapital)
                .weightedBreakEvenAmount(breakEvenAmount)
                .weightedBreakEvenUnits(totalBreakEvenUnits)
                .averageTicket(avgTicket)
                .salesOrdersBreakdown(salesOrdersBreakdown)
                .rawMaterialCmvBreakdown(rawMaterialCmvBreakdown)
                .operatingExpensesBreakdown(operatingExpensesBreakdown)
                .returnsBreakdown(returnsBreakdown)
                .breakEvenProductBreakdown(breakEvenProductBreakdown)
                .build();
    }

    private void addMaterialDto(List<MaterialCmvBreakdownDto> list, String code, String name, String category,
                                String unit, BigDecimal qty, BigDecimal cost, BigDecimal totalCmv, BigDecimal totalSales) {
        if (cost.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal pctCmv = totalCmv.compareTo(BigDecimal.ZERO) > 0
                    ? cost.divide(totalCmv, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            BigDecimal pctSales = totalSales.compareTo(BigDecimal.ZERO) > 0
                    ? cost.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            list.add(MaterialCmvBreakdownDto.builder()
                    .code(code)
                    .name(name)
                    .category(category)
                    .unitOfMeasure(unit)
                    .quantityConsumed(qty.setScale(2, RoundingMode.HALF_UP))
                    .totalCost(cost.setScale(2, RoundingMode.HALF_UP))
                    .percentOfCmv(pctCmv.setScale(2, RoundingMode.HALF_UP))
                    .percentOfSales(pctSales.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }
    }
}
