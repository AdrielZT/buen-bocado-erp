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
public class MaterialCmvBreakdownDto {
    private UUID materialId;
    private String code;
    private String name;
    private String category;
    private String unitOfMeasure;
    private BigDecimal quantityConsumed;
    private BigDecimal totalCost;
    private BigDecimal percentOfCmv;
    private BigDecimal percentOfSales;
}
