package com.buenbocado.erp.dto.supply;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplyPlanningDto {
    private BigDecimal totalEstimatedPurchasesCost;
    private long totalMaterialsAlert;
    private List<MaterialPlanningItem> planningItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialPlanningItem {
        private String rawMaterialCode;
        private String rawMaterialName;
        private String unitOfMeasure;
        private BigDecimal currentStock;
        private BigDecimal minimumStock;
        private BigDecimal requiredForPendingOrders;
        private BigDecimal suggestedPurchaseQty;
        private BigDecimal estimatedUnitCost;
        private BigDecimal estimatedTotalCost;
        private String urgency; // 'ALTA', 'MEDIA', 'BAJA'
    }
}
