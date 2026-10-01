package com.buenbocado.erp.dto.supply;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierRequest {
    @NotBlank(message = "La razón social es obligatoria")
    private String businessName;
    private String taxId;
    private String contactPhone;
    private String email;
}
