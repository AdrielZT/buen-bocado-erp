package com.buenbocado.erp.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceDashboardDto {
    private LocalDate startDate;
    private LocalDate endDate;

    // Métricas del Estado de Resultados
    private BigDecimal grossSales;         // Ventas Brutas Facturadas
    private BigDecimal totalReturnsAmount; // (-) Devoluciones y Mermas de Clientes en $
    private Integer totalReturnsUnits;     // Unidades devueltas
    private BigDecimal returnRatePercent;  // Tasa de devolución %
    private BigDecimal totalSales;         // Ventas Netas = Ventas Brutas - Devoluciones
    private BigDecimal totalCmv;           // Costo de Mercaderías Vendidas
    private BigDecimal grossProfit;        // Utilidad Bruta = Ventas Netas - CMV
    private BigDecimal grossMarginPercent; // Margen Bruto %

    private BigDecimal fixedExpenses;      // Gastos Fijos (Piso fijo de costos semifijos)
    private BigDecimal variableExpenses;   // Gastos Variables (Porción variable de costos semifijos)
    private BigDecimal totalOperatingExpenses; // Gastos Operativos Totales (Excluye compras de insumos para no duplicar con CMV)
    private BigDecimal rawMaterialPurchasesTotal; // Compras de Insumos y Materias Primas del período
    private BigDecimal inventoryVariationAmount;  // Variación Neta de Inventario (Compras - CMV)
    private BigDecimal cashSurplus;               // Flujo de Caja Neto (Cobranzas - Desembolsos)

    // Resultado y Margen Operativo (Punto 5: reemplaza EBITDA)
    private BigDecimal operatingProfit;        // Resultado Operativo ($) = Utilidad Bruta - Gastos Operativos
    private BigDecimal operatingMarginPercent; // Margen Operativo (%) = (Resultado Operativo / Ventas Netas) * 100

    // Resultado Neto (Punto 5: reemplaza EBIT)
    private BigDecimal netProfit;              // Resultado Neto ($) = Resultado Operativo - Amortizaciones/Intereses
    private BigDecimal netMarginPercent;       // Margen Neto (%) = (Resultado Neto / Ventas Netas) * 100

    // Aliases de retrocompatibilidad
    private BigDecimal ebitda;                 // Alias de Resultado Operativo
    private BigDecimal ebit;                   // Alias de Resultado Neto

    // Indicadores Financieros Clave
    private BigDecimal nof;                // Necesidades Operativas de Fondos
    private BigDecimal workingCapital;     // Capital de Trabajo
    private BigDecimal weightedBreakEvenAmount; // Punto de Equilibrio en Pesos
    private Integer weightedBreakEvenUnits;     // Punto de Equilibrio Ponderado en Unidades Totales
    private BigDecimal averageTicket;      // Ticket Promedio

    // 1. Desglose de Ventas por Orden (Fecha, Cliente, Detalle de Productos y Precios)
    private List<SalesOrderBreakdownDto> salesOrdersBreakdown;

    // 2. Desglose de CMV por Insumos y Materias Primas Reales
    private List<MaterialCmvBreakdownDto> rawMaterialCmvBreakdown;

    // 3. Desglose de Gastos Operativos Totales Unificados
    private List<OperatingExpenseBreakdownDto> operatingExpensesBreakdown;

    // 4. Desglose de Devoluciones de Clientes
    private List<ReturnItemDto> returnsBreakdown;

    // 5. Predicción del Punto de Equilibrio Multiproducto en Unidades
    private List<BreakEvenProductUnitDto> breakEvenProductBreakdown;
}
