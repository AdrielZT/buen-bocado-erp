package com.buenbocado.erp.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "operating_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperatingExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false, length = 50)
    private String category; // 'ALQUILER', 'SUELDOS', 'ENERGIA', 'GAS', 'COMBUSTIBLE', 'MANTENIMIENTO', 'PACKAGING', 'OTROS'

    @Column(nullable = false, length = 200)
    private String concept;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "is_fixed_cost", nullable = false)
    @Builder.Default
    private Boolean isFixedCost = true; // Para Punto de Equilibrio

    @Column(name = "voucher_number", length = 100)
    private String voucherNumber;

    @Column(name = "voucher_url")
    private String voucherUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
