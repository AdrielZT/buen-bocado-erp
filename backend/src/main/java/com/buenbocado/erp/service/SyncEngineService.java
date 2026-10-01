package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.sync.SyncMutationDto;
import com.buenbocado.erp.dto.sync.SyncPushRequest;
import com.buenbocado.erp.dto.sync.SyncPushResponse;
import com.buenbocado.erp.model.entity.ProcessedSyncMutation;
import com.buenbocado.erp.repository.OrderRepository;
import com.buenbocado.erp.repository.ProcessedSyncMutationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncEngineService {

    private final ProcessedSyncMutationRepository mutationRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public SyncPushResponse processPushBatch(SyncPushRequest request) {
        List<String> processedKeys = new ArrayList<>();
        List<String> ignoredDuplicates = new ArrayList<>();

        for (SyncMutationDto mutation : request.getMutations()) {
            // Verificar idempotencia: si ya fue procesada, se ignora para no duplicar datos
            if (mutationRepository.existsById(mutation.getIdempotencyKey())) {
                log.info("Mutación duplicada detectada (Idempotencia). Ignorando key: {}", mutation.getIdempotencyKey());
                ignoredDuplicates.add(mutation.getIdempotencyKey());
                continue;
            }

            // Registrar mutación procesada
            ProcessedSyncMutation processed = ProcessedSyncMutation.builder()
                    .idempotencyKey(mutation.getIdempotencyKey())
                    .clientDeviceId(request.getClientDeviceId())
                    .mutationType(mutation.getMutationType())
                    .entityId(mutation.getEntityId())
                    .build();

            mutationRepository.save(processed);
            processedKeys.add(mutation.getIdempotencyKey());
            log.info("Mutación {} procesada exitosamente para la entidad {}", mutation.getMutationType(), mutation.getEntityId());
        }

        Long currentMaxSeq = orderRepository.findMaxSequenceId();

        return SyncPushResponse.builder()
                .processedIdempotencyKeys(processedKeys)
                .ignoredDuplicateKeys(ignoredDuplicates)
                .currentServerSequenceId(currentMaxSeq != null ? currentMaxSeq : 0L)
                .build();
    }
}
