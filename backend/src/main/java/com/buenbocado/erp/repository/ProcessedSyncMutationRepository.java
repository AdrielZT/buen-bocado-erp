package com.buenbocado.erp.repository;

import com.buenbocado.erp.model.entity.ProcessedSyncMutation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedSyncMutationRepository extends JpaRepository<ProcessedSyncMutation, String> {
}
