package com.buenbocado.erp.dto.finance;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequestDto {
    @NotNull(message = "El cliente es obligatorio")
    private UUID clientId;

    @NotNull(message = "La fecha de entrega es obligatoria")
    private LocalDate deliveryDate;

    private String channel;
    private String paymentMethod;

    @NotEmpty(message = "Debe incluir al menos un producto")
    private List<CreateOrderItemRequestDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrderItemRequestDto {
        @NotNull(message = "El producto es obligatorio")
        private UUID productId;

        @NotNull(message = "La cantidad es obligatoria")
        private Integer quantity;

        @NotNull(message = "El precio pactado es obligatorio")
        private BigDecimal unitPrice;
    }
}
