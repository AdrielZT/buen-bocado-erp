package com.buenbocado.erp.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncPushResponse {
    private List<String> processedIdempotencyKeys;
    private List<String> ignoredDuplicateKeys;
    private Long currentServerSequenceId;
}
