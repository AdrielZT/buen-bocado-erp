package com.buenbocado.erp.dto.config;

import java.math.BigDecimal;

public record PlantPolicyDto(
    String plantName,
    String plantAddress,
    int maxFreshnessHours,
    BigDecimal defaultCreditLimit,
    BigDecimal maxWasteTolerancePercent,
    String orderCutoffTime,
    boolean alertOnNegativeEbitda,
    int standardShelfLifeDays
) {}
