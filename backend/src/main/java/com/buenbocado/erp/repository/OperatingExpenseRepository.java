package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.OperatingExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface OperatingExpenseRepository extends JpaRepository<OperatingExpense, UUID> {

    List<OperatingExpense> findByExpenseDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperatingExpense e " +
           "WHERE e.expenseDate BETWEEN :startDate AND :endDate AND e.isFixedCost = true")
    BigDecimal sumFixedExpensesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperatingExpense e " +
           "WHERE e.expenseDate BETWEEN :startDate AND :endDate AND e.isFixedCost = false")
    BigDecimal sumVariableExpensesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
