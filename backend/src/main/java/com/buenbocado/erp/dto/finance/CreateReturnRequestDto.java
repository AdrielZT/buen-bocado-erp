package com.buenbocado.erp.dto.finance;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReturnRequestDto {
    @NotNull(message = "El cliente es obligatorio")
    private UUID clientId;

    @NotNull(message = "El producto es obligatorio")
    private UUID productId;

    @NotNull(message = "La cantidad devuelta es obligatoria")
    private Integer quantity;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate returnDate;

    private String reason;
}
