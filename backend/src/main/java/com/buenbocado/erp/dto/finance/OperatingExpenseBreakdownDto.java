package com.buenbocado.erp.dto.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatingExpenseBreakdownDto {
    private UUID id;
    private LocalDate expenseDate;
    private String category;
    private String concept;
    private String voucherNumber;
    private BigDecimal amount;
    private Boolean isFixedCost;
    private BigDecimal percentOfExpenses;
    private BigDecimal percentOfSales;
}
