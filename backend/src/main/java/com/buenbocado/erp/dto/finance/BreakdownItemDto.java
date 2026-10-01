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
public class BreakdownItemDto {
    private UUID id;
    private String name;
    private String category;
    private String detail;
    private Integer quantity;
    private BigDecimal amount;
    private BigDecimal percentOfParent;
    private BigDecimal percentOfSales;
}
