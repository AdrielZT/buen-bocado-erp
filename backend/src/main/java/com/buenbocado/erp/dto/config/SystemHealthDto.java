package com.buenbocado.erp.dto.config;

import java.util.Map;

public record SystemHealthDto(
    String springBootStatus,
    String postgresStatus,
    String redisStatus,
    int pendingSyncMutations,
    long uptimeSeconds,
    String activeProfile,
    String dbVersion,
    Map<String, String> serviceDetails
) {}
