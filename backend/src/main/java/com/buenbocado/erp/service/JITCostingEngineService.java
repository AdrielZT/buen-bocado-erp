package com.buenbocado.erp.service;

import com.buenbocado.erp.model.entity.*;
import com.buenbocado.erp.repository.ProductionBatchRepository;
import com.buenbocado.erp.repository.RawMaterialRepository;
import com.buenbocado.erp.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JITCostingEngineService {

    private final RecipeRepository recipeRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final ProductionBatchRepository productionBatchRepository;

    @Transactional
    public ProductionBatch completeBatch(UUID batchId, int actualUnitsProduced, int wasteUnits) {
        ProductionBatch batch = productionBatchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Lote de producción no encontrado: " + batchId));

        Recipe recipe = recipeRepository.findByProductIdAndIsActiveTrue(batch.getProduct().getId())
                .orElseThrow(() -> new IllegalStateException("No existe receta activa para el producto: " + batch.getProduct().getName()));

        int totalUnitsPrepared = actualUnitsProduced + wasteUnits;
        BigDecimal totalBatchCost = BigDecimal.ZERO;

        // Descontar inventario de cada insumo y calcular costo real PEPS
        for (RecipeItem item : recipe.getItems()) {
            RawMaterial material = item.getRawMaterial();
            BigDecimal consumedQty = item.getQuantityNeeded().multiply(BigDecimal.valueOf(totalUnitsPrepared));

            // Actualizar stock en tiempo real
            material.setCurrentStock(material.getCurrentStock().subtract(consumedQty));
            rawMaterialRepository.save(material);

            // Costo específico según último precio de compra vigente
            BigDecimal itemTotalCost = consumedQty.multiply(material.getLastPurchasePrice());
            totalBatchCost = totalBatchCost.add(itemTotalCost);

            BatchMaterialConsumption consumption = BatchMaterialConsumption.builder()
                    .batch(batch)
                    .rawMaterial(material)
                    .quantityConsumed(consumedQty)
                    .unitPurchaseCost(material.getLastPurchasePrice())
                    .totalCost(itemTotalCost)
                    .build();

            batch.getConsumptions().add(consumption);
        }

        // Costo unitario real (absorbiendo mermas de elaboración)
        BigDecimal unitCost = actualUnitsProduced > 0
                ? totalBatchCost.divide(BigDecimal.valueOf(actualUnitsProduced), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        batch.setActualUnitsProduced(actualUnitsProduced);
        batch.setWasteUnits(wasteUnits);
        batch.setStatus("COMPLETED");
        batch.setTotalBatchCost(totalBatchCost);
        batch.setUnitCostCmv(unitCost);
        batch.setCompletedAt(Instant.now());

        log.info("Lote {} completado. Producidas: {}, Desecho: {}, CMV Unitario: ${}",
                batch.getBatchCode(), actualUnitsProduced, wasteUnits, unitCost);

        return productionBatchRepository.save(batch);
    }
}
