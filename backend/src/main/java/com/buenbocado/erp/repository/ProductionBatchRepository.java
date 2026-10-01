package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.ProductionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionBatchRepository extends JpaRepository<ProductionBatch, UUID> {
    Optional<ProductionBatch> findByBatchCode(String batchCode);
}
