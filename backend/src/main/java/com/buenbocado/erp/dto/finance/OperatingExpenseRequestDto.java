package com.buenbocado.erp.dto.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatingExpenseRequestDto {

    @NotNull(message = "La fecha del gasto es obligatoria")
    private LocalDate expenseDate;

    @NotBlank(message = "La categoría es obligatoria")
    private String category;

    @NotBlank(message = "El concepto es obligatorio")
    private String concept;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    private BigDecimal amount;

    @Builder.Default
    private Boolean isFixedCost = true;

    private String voucherNumber;
    private String voucherUrl;
}
