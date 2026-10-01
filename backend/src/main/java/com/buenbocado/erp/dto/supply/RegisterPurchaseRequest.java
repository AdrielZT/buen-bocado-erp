package com.buenbocado.erp.dto.supply;

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
public class RegisterPurchaseRequest {

    @NotNull(message = "El proveedor es obligatorio")
    private UUID supplierId;

    private String invoiceNumber;

    @NotNull(message = "La fecha de factura es obligatoria")
    private LocalDate invoiceDate;

    @Builder.Default
    private String paymentStatus = "PAID"; // 'PENDING' o 'PAID'

    @NotEmpty(message = "Debe incluir al menos un insumo en la compra")
    private List<PurchaseItemLineRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseItemLineRequest {
        @NotNull(message = "El insumo es obligatorio")
        private UUID rawMaterialId;

        @NotNull(message = "La cantidad es obligatoria")
        private BigDecimal quantity;

        @NotNull(message = "El precio unitario es obligatorio")
        private BigDecimal unitPrice;
    }
}
