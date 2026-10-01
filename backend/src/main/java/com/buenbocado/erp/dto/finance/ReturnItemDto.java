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
public class ReturnItemDto {
    private UUID id;
    private LocalDate returnDate;
    private String clientName;
    private String productName;
    private Integer quantity;
    private BigDecimal creditedAmount;
    private BigDecimal lossAmount;
    private String reason;
}
