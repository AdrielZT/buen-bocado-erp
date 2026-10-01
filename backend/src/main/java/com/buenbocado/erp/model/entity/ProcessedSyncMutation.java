package com.buenbocado.erp.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "processed_sync_mutations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedSyncMutation {

    @Id
    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey; // Hash SHA-256 de la mutación del cliente

    @Column(name = "client_device_id", nullable = false, length = 100)
    private String clientDeviceId;

    @Column(name = "mutation_type", nullable = false, length = 50)
    private String mutationType; // 'CREATE_ORDER', 'RECORD_PAYMENT', 'RECORD_RETURN'

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @CreationTimestamp
    @Column(name = "processed_at", nullable = false, updatable = false)
    private Instant processedAt;
}
