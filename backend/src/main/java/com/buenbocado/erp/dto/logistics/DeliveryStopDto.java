package com.buenbocado.erp.dto.logistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryStopDto {
    private UUID orderId;
    private UUID clientId;
    private String clientBusinessName;
    private String deliveryAddress;
    private String contactName;
    private String phone;
    private LocalDate deliveryDate;
    private String deliveryTimeSlot;
    private String channel;
    private String status; // 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'REJECTED'
    private BigDecimal totalAmount;
    private String paymentMethod;
    private Integer totalUnits;
    private Integer pebetesUnits;
    private Integer triplesUnits;
    private String itemsSummary;
    private Integer sequenceOrder;
    private String assignedVehicle;
    private String assignedDriver;
    private String zone;
    private String notes;
}
