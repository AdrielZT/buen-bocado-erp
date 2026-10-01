package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.logistics.DeliveryStopDto;
import com.buenbocado.erp.dto.logistics.LogisticsRouteSheetDto;
import com.buenbocado.erp.model.entity.Client;
import com.buenbocado.erp.model.entity.Order;
import com.buenbocado.erp.model.entity.OrderItem;
import com.buenbocado.erp.model.entity.Product;
import com.buenbocado.erp.repository.ClientRepository;
import com.buenbocado.erp.repository.OrderRepository;
import com.buenbocado.erp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogisticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ClientRepository clientRepository;

    @Transactional(readOnly = true)
    public LogisticsRouteSheetDto getRouteSheet(LocalDate startDate, LocalDate endDate) {
        log.info("Generando hoja de ruta de logística para rango {} a {}", startDate, endDate);

        List<Order> orders = orderRepository.findByDeliveryDateBetweenWithDetails(startDate, endDate);
        Map<UUID, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<DeliveryStopDto> stops = new ArrayList<>();
        int seq = 1;

        int totalPebetes = 0;
        int totalTriples = 0;
        int totalUnits = 0;
        BigDecimal totalAmountToCollect = BigDecimal.ZERO;
        BigDecimal totalAmountCollected = BigDecimal.ZERO;
        int deliveredCount = 0;
        int inTransitCount = 0;
        int pendingCount = 0;
        int rejectedCount = 0;

        for (Order order : orders) {
            int pebetesInOrder = 0;
            int triplesInOrder = 0;
            int totalOrderUnits = 0;
            List<String> itemNames = new ArrayList<>();

            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    Product prod = productMap.get(item.getProductId());
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    totalOrderUnits += qty;

                    if (prod != null) {
                        String cat = prod.getCategory() != null ? prod.getCategory().toUpperCase() : "";
                        if (cat.contains("PEBETE")) {
                            pebetesInOrder += qty;
                        } else if (cat.contains("MIGA") || cat.contains("TRIPLE")) {
                            triplesInOrder += qty;
                        } else {
                            pebetesInOrder += qty; // Default clasificación
                        }
                        itemNames.add(qty + "x " + prod.getName());
                    } else {
                        pebetesInOrder += qty;
                        itemNames.add(qty + "x Producto");
                    }
                }
            }

            totalPebetes += pebetesInOrder;
            totalTriples += triplesInOrder;
            totalUnits += totalOrderUnits;

            BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            totalAmountToCollect = totalAmountToCollect.add(orderTotal);

            String status = order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDING";
            if ("DELIVERED".equals(status)) {
                deliveredCount++;
                totalAmountCollected = totalAmountCollected.add(orderTotal);
            } else if ("IN_TRANSIT".equals(status) || "EN_TRANSITO".equals(status)) {
                inTransitCount++;
            } else if ("REJECTED".equals(status) || "CANCELLED".equals(status)) {
                rejectedCount++;
            } else {
                pendingCount++;
            }

            Client client = order.getClient();
            String address = client != null && client.getDeliveryAddress() != null ? client.getDeliveryAddress() : "Planta Buen Bocado";
            String businessName = client != null && client.getBusinessName() != null ? client.getBusinessName() : "Cliente Mostrador";
            String contact = client != null ? client.getContactName() : "Encargado";
            String phone = client != null ? client.getPhone() : "-";

            // Asignación inteligente de zona y vehículo
            String zone = determineZone(address, seq);
            String assignedVehicle = (seq % 2 == 1) ? "Furgón Térmico 1 (Master 2°C)" : "Furgón Térmico 2 (Partner 4°C)";
            String assignedDriver = (seq % 2 == 1) ? "Carlos Gómez" : "Martín Díaz";

            DeliveryStopDto stop = DeliveryStopDto.builder()
                    .orderId(order.getId())
                    .clientId(client != null ? client.getId() : null)
                    .clientBusinessName(businessName)
                    .deliveryAddress(address)
                    .contactName(contact)
                    .phone(phone)
                    .deliveryDate(order.getDeliveryDate())
                    .deliveryTimeSlot(order.getDeliveryTimeSlot() != null ? order.getDeliveryTimeSlot() : "06:00 - 09:30")
                    .channel(order.getChannel())
                    .status(status)
                    .totalAmount(orderTotal)
                    .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod() : "ACCOUNT_CREDIT")
                    .totalUnits(totalOrderUnits)
                    .pebetesUnits(pebetesInOrder)
                    .triplesUnits(triplesInOrder)
                    .itemsSummary(String.join(", ", itemNames))
                    .sequenceOrder(seq++)
                    .assignedVehicle(assignedVehicle)
                    .assignedDriver(assignedDriver)
                    .zone(zone)
                    .build();

            stops.add(stop);
        }

        return LogisticsRouteSheetDto.builder()
                .date(startDate)
                .totalStops(stops.size())
                .deliveredStops(deliveredCount)
                .pendingStops(pendingCount)
                .inTransitStops(inTransitCount)
                .rejectedStops(rejectedCount)
                .totalPebetes(totalPebetes)
                .totalTriples(totalTriples)
                .totalUnits(totalUnits)
                .totalAmountToCollect(totalAmountToCollect)
                .totalAmountCollected(totalAmountCollected)
                .stops(stops)
                .build();
    }

    @Transactional
    public DeliveryStopDto updateDeliveryStatus(UUID orderId, String newStatus, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado con ID: " + orderId));

        order.setStatus(newStatus.toUpperCase());
        orderRepository.save(order);
        log.info("Estado del pedido {} actualizado a {} en logística", orderId, newStatus);

        return DeliveryStopDto.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .notes(notes)
                .build();
    }

    @Transactional
    public DeliveryStopDto confirmDelivery(UUID orderId, BigDecimal collectedAmount, String paymentMethod, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado con ID: " + orderId));

        order.setStatus("DELIVERED");
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            order.setPaymentMethod(paymentMethod);
        }
        orderRepository.save(order);

        // Si se cobró dinero en mano del chofer, imputar a la cuenta corriente del cliente
        if (collectedAmount != null && collectedAmount.compareTo(BigDecimal.ZERO) > 0 && order.getClient() != null) {
            Client client = order.getClient();
            BigDecimal current = client.getCurrentBalance() != null ? client.getCurrentBalance() : BigDecimal.ZERO;
            client.setCurrentBalance(current.subtract(collectedAmount));
            clientRepository.save(client);
            log.info("Cobranza en reparto por {} imputada a la cuenta de {}", collectedAmount, client.getBusinessName());
        }

        return DeliveryStopDto.builder()
                .orderId(order.getId())
                .status("DELIVERED")
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .notes(notes)
                .build();
    }

    private String determineZone(String address, int seq) {
        String addrUpper = address != null ? address.toUpperCase() : "";
        if (addrUpper.contains("RIVADAVIA") || addrUpper.contains("SAN MART") || addrUpper.contains("CENTRO")) {
            return "Zona Centro (San Martín)";
        } else if (addrUpper.contains("BELGRANO") || addrUpper.contains("SAN ISIDRO") || addrUpper.contains("NORTE")) {
            return "Zona Norte (San Isidro / Olivos)";
        } else if (addrUpper.contains("SAN JUAN") || addrUpper.contains("INDEPENDENCIA") || addrUpper.contains("SUR")) {
            return "Zona Sur (Constitución / Barracas)";
        } else {
            return (seq % 2 == 1) ? "Zona Centro (San Martín)" : "Zona Norte (Corredor Norte)";
        }
    }
}
