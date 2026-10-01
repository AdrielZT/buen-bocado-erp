package com.buenbocado.erp.dto.config;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record UserDto(
    UUID id,
    String username,
    String fullName,
    String email,
    String phone,
    String roleId,
    String roleName,
    boolean isActive,
    Instant createdAt
) {}
