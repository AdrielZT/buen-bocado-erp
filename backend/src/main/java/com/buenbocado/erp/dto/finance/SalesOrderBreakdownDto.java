package com.buenbocado.erp.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderBreakdownDto {
    private UUID orderId;
    private LocalDate orderDate;
    private String clientName;
    private String clientType;
    private BigDecimal totalAmount;
    private BigDecimal percentOfSales;
    private String productsSummary;
    private Integer totalUnits;
    private List<SalesOrderItemDetailDto> items;
}
