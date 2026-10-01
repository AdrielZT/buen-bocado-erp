package com.buenbocado.erp.dto.supply;

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
public class RawMaterialStockDto {
    private UUID id;
    private String code;
    private String name;
    private String category;
    private String unitOfMeasure;
    private BigDecimal currentStock;
    private BigDecimal minimumStock;
    private BigDecimal lastPurchasePrice;
    private BigDecimal totalValue;
    private String stockStatus; // 'CRITICO', 'ADVERTENCIA', 'OPTIMO'
    private BigDecimal suggestedReorderQty;
    private Boolean isActive;
}
