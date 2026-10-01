package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o WHERE o.serverSequenceId > :sinceSequenceId ORDER BY o.serverSequenceId ASC")
    List<Order> findDeltasSince(@Param("sinceSequenceId") Long sinceSequenceId);

    @Query("SELECT MAX(o.serverSequenceId) FROM Order o")
    Long findMaxSequenceId();

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.client LEFT JOIN FETCH o.items WHERE o.deliveryDate = :deliveryDate ORDER BY o.createdAt ASC")
    List<Order> findByDeliveryDateWithDetails(@Param("deliveryDate") java.time.LocalDate deliveryDate);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.client LEFT JOIN FETCH o.items WHERE o.deliveryDate BETWEEN :startDate AND :endDate ORDER BY o.deliveryDate ASC, o.createdAt ASC")
    List<Order> findByDeliveryDateBetweenWithDetails(@Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);
}
