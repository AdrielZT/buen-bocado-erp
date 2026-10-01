package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.finance.FinanceDashboardDto;
import com.buenbocado.erp.model.entity.OperatingExpense;
import com.buenbocado.erp.model.entity.Order;
import com.buenbocado.erp.model.entity.OrderItem;
import com.buenbocado.erp.model.entity.Product;
import com.buenbocado.erp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceAnalyticsEngineServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OperatingExpenseRepository expenseRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private OrderReturnRepository returnRepository;

    @InjectMocks
    private FinanceAnalyticsEngineService financeAnalyticsEngineService;

    private LocalDate startDate;
    private LocalDate endDate;

    @BeforeEach
    void setUp() {
        startDate = LocalDate.of(2026, 9, 1);
        endDate = LocalDate.of(2026, 9, 30);
        lenient().when(clientRepository.findAll()).thenReturn(Collections.emptyList());
        lenient().when(returnRepository.findAll()).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("Debe calcular correctamente todas las métricas financieras y desgloses en un escenario nominal")
    void testCalculateDashboardNominal() {
        UUID prod1Id = UUID.randomUUID();
        UUID prod2Id = UUID.randomUUID();

        Product prod1 = Product.builder().id(prod1Id).name("Pebete Clásico").category("PEBETE").sku("SAN-PEB-JYQ").build();
        Product prod2 = Product.builder().id(prod2Id).name("Triple Miga").category("MIGA_TRIPLE").sku("SAN-MIG-JYQ").build();
        when(productRepository.findAll()).thenReturn(List.of(prod1, prod2));

        // Orden 1: Total $10.000 (Pebetes)
        OrderItem item1 = OrderItem.builder()
                .id(UUID.randomUUID())
                .productId(prod1Id)
                .quantity(10)
                .unitPrice(new BigDecimal("1000.00"))
                .unitCostCmv(new BigDecimal("425.0000"))
                .totalPrice(new BigDecimal("10000.00"))
                .build();

        Order order1 = Order.builder()
                .id(UUID.randomUUID())
                .totalAmount(new BigDecimal("10000.00"))
                .deliveryDate(startDate.plusDays(5))
                .items(List.of(item1))
                .build();

        // Orden 2: Total $20.000 (Triples de miga)
        OrderItem item2 = OrderItem.builder()
                .id(UUID.randomUUID())
                .productId(prod2Id)
                .quantity(20)
                .unitPrice(new BigDecimal("1000.00"))
                .unitCostCmv(new BigDecimal("350.0000"))
                .totalPrice(new BigDecimal("20000.00"))
                .build();

        Order order2 = Order.builder()
                .id(UUID.randomUUID())
                .totalAmount(new BigDecimal("20000.00"))
                .deliveryDate(startDate.plusDays(10))
                .items(List.of(item2))
                .build();

        when(orderRepository.findAll()).thenReturn(List.of(order1, order2));

        // Gastos: Fijos = $5.000, Variables = $2.000
        OperatingExpense fixedExp = OperatingExpense.builder()
                .id(UUID.randomUUID())
                .expenseDate(startDate.plusDays(5))
                .concept("Alquiler")
                .category("ALQUILER")
                .amount(new BigDecimal("5000.00"))
                .isFixedCost(true)
                .build();

        OperatingExpense varExp = OperatingExpense.builder()
                .id(UUID.randomUUID())
                .expenseDate(startDate.plusDays(10))
                .concept("Electricidad")
                .category("ENERGIA")
                .amount(new BigDecimal("2000.00"))
                .isFixedCost(false)
                .build();

        when(expenseRepository.findByExpenseDateBetween(startDate, endDate)).thenReturn(List.of(fixedExp, varExp));

        // WHEN
        FinanceDashboardDto result = financeAnalyticsEngineService.calculateDashboard(startDate, endDate);

        // THEN
        // Ventas = 10.000 + 20.000 = 30.000
        assertThat(result.getTotalSales()).isEqualByComparingTo(new BigDecimal("30000.00"));

        // CMV = (10 * 425) + (20 * 350) = 4.250 + 7.000 = 11.250
        BigDecimal expectedCmv = new BigDecimal("11250.00");
        assertThat(result.getTotalCmv()).isEqualByComparingTo(expectedCmv);

        // Utilidad Bruta = 30.000 - 11.250 = 18.750
        BigDecimal expectedGrossProfit = new BigDecimal("18750.00");
        assertThat(result.getGrossProfit()).isEqualByComparingTo(expectedGrossProfit);

        // Margen Bruto % = (18.750 / 30.000) * 100 = 62.5000%
        assertThat(result.getGrossMarginPercent()).isEqualByComparingTo(new BigDecimal("62.5000"));

        // Gastos Operativos = 5.000 + 2.000 = 7.000
        assertThat(result.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("7000.00"));

        // EBITDA = 18.750 - 7.000 = 11.750
        assertThat(result.getEbitda()).isEqualByComparingTo(new BigDecimal("11750.00"));

        // Desglose de Ventas por Órdenes / Cliente con items anidados
        assertThat(result.getSalesOrdersBreakdown()).hasSize(2);
        assertThat(result.getSalesOrdersBreakdown().get(0).getItems()).isNotEmpty();

        // Desglose de CMV por Insumos
        assertThat(result.getRawMaterialCmvBreakdown()).isNotEmpty();

        // Desglose de Gastos Operativos Unificados
        assertThat(result.getOperatingExpensesBreakdown()).hasSize(2);
        assertThat(result.getOperatingExpensesBreakdown().get(0).getPercentOfExpenses()).isNotNull();

        // Predicción de punto de equilibrio multiproducto en unidades
        assertThat(result.getWeightedBreakEvenUnits()).isGreaterThan(0);
        assertThat(result.getBreakEvenProductBreakdown()).isNotEmpty();

        verify(orderRepository, times(1)).findAll();
        verify(productRepository, times(1)).findAll();
        verify(expenseRepository, times(1)).findByExpenseDateBetween(startDate, endDate);
    }

    @Test
    @DisplayName("Debe manejar con resiliencia el caso de borde de período sin ventas (cero órdenes)")
    void testCalculateDashboardZeroSales() {
        when(productRepository.findAll()).thenReturn(Collections.emptyList());
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());

        OperatingExpense fixedExp = OperatingExpense.builder()
                .id(UUID.randomUUID())
                .expenseDate(startDate)
                .concept("Alquiler")
                .category("ALQUILER")
                .amount(new BigDecimal("1500.00"))
                .isFixedCost(true)
                .build();
        when(expenseRepository.findByExpenseDateBetween(startDate, endDate)).thenReturn(List.of(fixedExp));

        // WHEN
        FinanceDashboardDto result = financeAnalyticsEngineService.calculateDashboard(startDate, endDate);

        // THEN: Cero excepciones por división por cero
        assertThat(result.getTotalSales()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalCmv()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getGrossProfit()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getGrossMarginPercent()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(result.getEbitda()).isEqualByComparingTo(new BigDecimal("-1500.00"));
        assertThat(result.getWeightedBreakEvenAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getAverageTicket()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Debe controlar el caso de margen de contribución negativo o nulo sin dividir por cero")
    void testCalculateDashboardNegativeContributionMargin() {
        when(productRepository.findAll()).thenReturn(Collections.emptyList());

        OrderItem item = OrderItem.builder()
                .id(UUID.randomUUID())
                .productId(UUID.randomUUID())
                .quantity(10)
                .unitPrice(new BigDecimal("100.00"))
                .unitCostCmv(new BigDecimal("120.0000")) // Costo mayor al precio
                .totalPrice(new BigDecimal("1000.00"))
                .build();

        Order order = Order.builder()
                .id(UUID.randomUUID())
                .totalAmount(new BigDecimal("1000.00"))
                .items(List.of(item))
                .build();

        when(orderRepository.findAll()).thenReturn(List.of(order));

        OperatingExpense fixedExp = OperatingExpense.builder()
                .id(UUID.randomUUID())
                .expenseDate(startDate)
                .concept("Alquiler")
                .category("ALQUILER")
                .amount(new BigDecimal("2000.00"))
                .isFixedCost(true)
                .build();

        OperatingExpense varExp = OperatingExpense.builder()
                .id(UUID.randomUUID())
                .expenseDate(startDate)
                .concept("Flete")
                .category("COMBUSTIBLE")
                .amount(new BigDecimal("100.00"))
                .isFixedCost(false)
                .build();

        when(expenseRepository.findByExpenseDateBetween(startDate, endDate)).thenReturn(List.of(fixedExp, varExp));

        // WHEN
        FinanceDashboardDto result = financeAnalyticsEngineService.calculateDashboard(startDate, endDate);

        // THEN
        assertThat(result.getWeightedBreakEvenAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getGrossProfit()).isEqualByComparingTo(new BigDecimal("-200.00"));
        assertThat(result.getEbitda()).isEqualByComparingTo(new BigDecimal("-2300.00"));
    }

    @Test
    @DisplayName("Debe verificar que las fechas del período se preserven íntegramente en el DTO resultante")
    void testCalculateDashboardPeriodDates() {
        when(productRepository.findAll()).thenReturn(Collections.emptyList());
        when(orderRepository.findAll()).thenReturn(Collections.emptyList());
        when(expenseRepository.findByExpenseDateBetween(startDate, endDate)).thenReturn(Collections.emptyList());

        FinanceDashboardDto result = financeAnalyticsEngineService.calculateDashboard(startDate, endDate);

        assertThat(result.getStartDate()).isEqualTo(startDate);
        assertThat(result.getEndDate()).isEqualTo(endDate);
    }
}
