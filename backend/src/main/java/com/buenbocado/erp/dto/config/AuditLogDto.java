package com.buenbocado.erp.dto.config;

import java.time.Instant;

public record AuditLogDto(
    String id,
    Instant timestamp,
    String username,
    String action,
    String module,
    String entity,
    String details,
    String ipAddress,
    String status
) {}
