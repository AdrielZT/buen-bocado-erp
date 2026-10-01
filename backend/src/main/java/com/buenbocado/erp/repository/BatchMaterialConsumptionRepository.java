package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.BatchMaterialConsumption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BatchMaterialConsumptionRepository extends JpaRepository<BatchMaterialConsumption, UUID> {
}
