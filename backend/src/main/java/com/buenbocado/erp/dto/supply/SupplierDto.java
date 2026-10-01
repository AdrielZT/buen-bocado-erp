package com.buenbocado.erp.dto.supply;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDto {
    private UUID id;
    private String businessName;
    private String taxId;
    private String contactPhone;
    private String email;
    private Boolean isActive;
}
