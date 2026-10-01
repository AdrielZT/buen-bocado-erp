package com.buenbocado.erp.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String category; // 'PEBETE', 'MIGA_TRIPLE', 'MILANESA', 'BEBIDA', 'OTRO'

    @Column(name = "base_unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseUnitPrice;

    @Column(name = "shelf_life_hours", nullable = false)
    @Builder.Default
    private Integer shelfLifeHours = 24; // RN-01: Frescura 12 a 24 horas

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
