package com.buenbocado.erp.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_returns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReturn {

    @Id
    private UUID id;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "credited_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal creditedAmount;

    @Column(nullable = false, length = 100)
    private String reason; // 'EXPIRED_FROZEN', 'DAMAGED', 'WRONG_ITEM'

    @Column(name = "loss_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal lossAmount; // Pérdida neta real asumida por la fábrica

    @Column(name = "seller_user_id")
    private UUID sellerUserId;

    @Column(name = "server_sequence_id", insertable = false, updatable = false)
    private Long serverSequenceId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
