package com.buenbocado.erp.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "production_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "batch_code", nullable = false, unique = true, length = 100)
    private String batchCode; // Ej: L-20260928-PEB-01

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "planned_units", nullable = false)
    private Integer plannedUnits;

    @Column(name = "actual_units_produced", nullable = false)
    @Builder.Default
    private Integer actualUnitsProduced = 0;

    @Column(name = "waste_units", nullable = false)
    @Builder.Default
    private Integer wasteUnits = 0;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PLANNED"; // 'PLANNED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED'

    @Column(name = "unit_cost_cmv", nullable = false, precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal unitCostCmv = BigDecimal.ZERO;

    @Column(name = "total_batch_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalBatchCost = BigDecimal.ZERO;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BatchMaterialConsumption> consumptions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
