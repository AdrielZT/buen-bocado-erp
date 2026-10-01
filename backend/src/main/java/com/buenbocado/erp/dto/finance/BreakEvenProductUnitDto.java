package com.buenbocado.erp.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreakEvenProductUnitDto {
    private UUID productId;
    private String productName;
    private String category;
    private BigDecimal averagePrice;
    private BigDecimal volumeSharePercent;
    private Integer requiredUnits;
    private BigDecimal requiredSalesAmount;
}
