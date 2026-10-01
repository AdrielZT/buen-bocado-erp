package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, UUID> {
    Optional<Recipe> findByProductIdAndIsActiveTrue(UUID productId);
}
