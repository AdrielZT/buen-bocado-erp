package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.PurchaseInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.repository.query.Param;

@Repository
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, UUID> {

    @Query("SELECT DISTINCT pi FROM PurchaseInvoice pi LEFT JOIN FETCH pi.supplier LEFT JOIN FETCH pi.items it LEFT JOIN FETCH it.rawMaterial ORDER BY pi.invoiceDate DESC")
    List<PurchaseInvoice> findAllWithDetails();

    @Query("SELECT DISTINCT pi FROM PurchaseInvoice pi LEFT JOIN FETCH pi.supplier LEFT JOIN FETCH pi.items it LEFT JOIN FETCH it.rawMaterial WHERE pi.invoiceDate BETWEEN :startDate AND :endDate ORDER BY pi.invoiceDate DESC")
    List<PurchaseInvoice> findByInvoiceDateBetweenWithDetails(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
