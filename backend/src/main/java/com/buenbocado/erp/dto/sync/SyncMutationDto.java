package com.buenbocado.erp.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncMutationDto {
    private String idempotencyKey; // SHA-256
    private String mutationType; // 'CREATE_ORDER', 'RECORD_PAYMENT', 'RECORD_RETURN'
    private UUID entityId;
    private String payloadJson; // JSON serializado de la entidad
}
