package com.buenbocado.erp.dto.logistics;

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
public class LogisticsRouteSheetDto {
    private LocalDate date;
    private Integer totalStops;
    private Integer deliveredStops;
    private Integer pendingStops;
    private Integer inTransitStops;
    private Integer rejectedStops;
    private Integer totalPebetes;
    private Integer totalTriples;
    private Integer totalUnits;
    private BigDecimal totalAmountToCollect;
    private BigDecimal totalAmountCollected;
    private List<DeliveryStopDto> stops;
}
