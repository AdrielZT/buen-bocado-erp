export interface DeliveryStop {
  orderId: string;
  clientId?: string;
  clientBusinessName: string;
  deliveryAddress: string;
  contactName: string;
  phone: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  channel: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED';
  totalAmount: number;
  paymentMethod: string;
  totalUnits: number;
  pebetesUnits: number;
  triplesUnits: number;
  itemsSummary: string;
  sequenceOrder: number;
  assignedVehicle: string;
  assignedDriver: string;
  zone: string;
  notes?: string;
}

export interface LogisticsRouteSheet {
  date: string;
  totalStops: number;
  deliveredStops: number;
  pendingStops: number;
  inTransitStops: number;
  rejectedStops: number;
  totalPebetes: number;
  totalTriples: number;
  totalUnits: number;
  totalAmountToCollect: number;
  totalAmountCollected: number;
  stops: DeliveryStop[];
}

export interface FleetVehicle {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  capacityUnits: number;
  temperatureCelsius: number;
  status: 'DISPONIBLE' | 'EN_REPARTO' | 'MANTENIMIENTO' | 'FUERA_DE_SERVICIO';
}
