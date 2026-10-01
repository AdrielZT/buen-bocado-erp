package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.sync.SyncMutationDto;
import com.buenbocado.erp.dto.sync.SyncPushRequest;
import com.buenbocado.erp.dto.sync.SyncPushResponse;
import com.buenbocado.erp.model.entity.ProcessedSyncMutation;
import com.buenbocado.erp.repository.OrderRepository;
import com.buenbocado.erp.repository.ProcessedSyncMutationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncEngineServiceTest {

    @Mock
    private ProcessedSyncMutationRepository mutationRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private SyncEngineService syncEngineService;

    private String deviceId;
    private String hash1;
    private String hash2;
    private UUID entityId1;
    private UUID entityId2;

    @BeforeEach
    void setUp() {
        deviceId = "POS-DEVICE-TABLET-01";
        // Simulamos hashes SHA-256 reales de 64 caracteres hexadecimales
        hash1 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        hash2 = "ca978112ca1bbdcafac231b39a23dc4da7860814961609157c91479f753f5770";
        entityId1 = UUID.randomUUID();
        entityId2 = UUID.randomUUID();
    }

    @Test
    @DisplayName("Debe procesar exitosamente un lote de mutaciones nuevas y devolver la secuencia actual")
    void testProcessPushBatchAllNewMutations() {
        // GIVEN: 2 mutaciones nuevas que no existen en el servidor
        SyncMutationDto mut1 = SyncMutationDto.builder()
                .idempotencyKey(hash1)
                .mutationType("CREATE_ORDER")
                .entityId(entityId1)
                .payloadJson("{\"totalAmount\": 15000.00}")
                .build();

        SyncMutationDto mut2 = SyncMutationDto.builder()
                .idempotencyKey(hash2)
                .mutationType("RECORD_PAYMENT")
                .entityId(entityId2)
                .payloadJson("{\"paymentAmount\": 10000.00}")
                .build();

        SyncPushRequest request = SyncPushRequest.builder()
                .clientDeviceId(deviceId)
                .mutations(List.of(mut1, mut2))
                .build();

        when(mutationRepository.existsById(hash1)).thenReturn(false);
        when(mutationRepository.existsById(hash2)).thenReturn(false);
        when(orderRepository.findMaxSequenceId()).thenReturn(142L);

        // WHEN
        SyncPushResponse response = syncEngineService.processPushBatch(request);

        // THEN
        assertThat(response.getProcessedIdempotencyKeys())
                .containsExactly(hash1, hash2);
        assertThat(response.getIgnoredDuplicateKeys()).isEmpty();
        assertThat(response.getCurrentServerSequenceId()).isEqualTo(142L);

        // Verificar que se guardaron ambas mutaciones con los datos correctos
        ArgumentCaptor<ProcessedSyncMutation> captor = ArgumentCaptor.forClass(ProcessedSyncMutation.class);
        verify(mutationRepository, times(2)).save(captor.capture());

        List<ProcessedSyncMutation> savedEntities = captor.getAllValues();
        assertThat(savedEntities.get(0).getIdempotencyKey()).isEqualTo(hash1);
        assertThat(savedEntities.get(0).getClientDeviceId()).isEqualTo(deviceId);
        assertThat(savedEntities.get(0).getMutationType()).isEqualTo("CREATE_ORDER");
        assertThat(savedEntities.get(0).getEntityId()).isEqualTo(entityId1);

        assertThat(savedEntities.get(1).getIdempotencyKey()).isEqualTo(hash2);
        assertThat(savedEntities.get(1).getClientDeviceId()).isEqualTo(deviceId);
        assertThat(savedEntities.get(1).getMutationType()).isEqualTo("RECORD_PAYMENT");
        assertThat(savedEntities.get(1).getEntityId()).isEqualTo(entityId2);
    }

    @Test
    @DisplayName("Debe ignorar mutaciones duplicadas garantizando idempotencia estricta ante reintentos")
    void testProcessPushBatchAllDuplicateMutations() {
        // GIVEN: 2 mutaciones que ya fueron procesadas en una sincronización anterior
        SyncMutationDto mut1 = SyncMutationDto.builder()
                .idempotencyKey(hash1)
                .mutationType("CREATE_ORDER")
                .entityId(entityId1)
                .build();

        SyncMutationDto mut2 = SyncMutationDto.builder()
                .idempotencyKey(hash2)
                .mutationType("RECORD_PAYMENT")
                .entityId(entityId2)
                .build();

        SyncPushRequest request = SyncPushRequest.builder()
                .clientDeviceId(deviceId)
                .mutations(List.of(mut1, mut2))
                .build();

        when(mutationRepository.existsById(hash1)).thenReturn(true);
        when(mutationRepository.existsById(hash2)).thenReturn(true);
        when(orderRepository.findMaxSequenceId()).thenReturn(99L);

        // WHEN
        SyncPushResponse response = syncEngineService.processPushBatch(request);

        // THEN
        assertThat(response.getProcessedIdempotencyKeys()).isEmpty();
        assertThat(response.getIgnoredDuplicateKeys()).containsExactly(hash1, hash2);
        assertThat(response.getCurrentServerSequenceId()).isEqualTo(99L);

        // No se debe persistir ninguna mutación duplicada
        verify(mutationRepository, never()).save(any(ProcessedSyncMutation.class));
    }

    @Test
    @DisplayName("Debe discriminar correctamente en un lote mixto con mutaciones nuevas y duplicadas")
    void testProcessPushBatchMixedMutations() {
        // GIVEN: Hash1 duplicado, Hash2 nuevo
        SyncMutationDto mut1 = SyncMutationDto.builder()
                .idempotencyKey(hash1)
                .mutationType("CREATE_ORDER")
                .entityId(entityId1)
                .build();

        SyncMutationDto mut2 = SyncMutationDto.builder()
                .idempotencyKey(hash2)
                .mutationType("RECORD_RETURN")
                .entityId(entityId2)
                .build();

        SyncPushRequest request = SyncPushRequest.builder()
                .clientDeviceId(deviceId)
                .mutations(List.of(mut1, mut2))
                .build();

        when(mutationRepository.existsById(hash1)).thenReturn(true);
        when(mutationRepository.existsById(hash2)).thenReturn(false);
        when(orderRepository.findMaxSequenceId()).thenReturn(105L);

        // WHEN
        SyncPushResponse response = syncEngineService.processPushBatch(request);

        // THEN
        assertThat(response.getProcessedIdempotencyKeys()).containsExactly(hash2);
        assertThat(response.getIgnoredDuplicateKeys()).containsExactly(hash1);
        assertThat(response.getCurrentServerSequenceId()).isEqualTo(105L);

        verify(mutationRepository, times(1)).save(any(ProcessedSyncMutation.class));
    }

    @Test
    @DisplayName("Debe retornar secuencia 0L cuando la tabla de órdenes se encuentra vacía (max sequence null)")
    void testProcessPushBatchNullSequenceIdReturnsZero() {
        SyncPushRequest request = SyncPushRequest.builder()
                .clientDeviceId(deviceId)
                .mutations(Collections.emptyList())
                .build();

        when(orderRepository.findMaxSequenceId()).thenReturn(null);

        SyncPushResponse response = syncEngineService.processPushBatch(request);

        assertThat(response.getProcessedIdempotencyKeys()).isEmpty();
        assertThat(response.getIgnoredDuplicateKeys()).isEmpty();
        assertThat(response.getCurrentServerSequenceId()).isEqualTo(0L);
    }
}
