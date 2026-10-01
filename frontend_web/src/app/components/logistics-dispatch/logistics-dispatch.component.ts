import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogisticsService } from '../../services/logistics.service';
import { LogisticsRouteSheet, DeliveryStop, FleetVehicle } from '../../models/logistics.model';
import { getTodayDateString, getCurrentMonthStart, getCurrentMonthEnd } from '../../utils/date-utils';

@Component({
  selector: 'app-logistics-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logistics-dispatch.component.html',
  styleUrls: ['./logistics-dispatch.component.scss']
})
export class LogisticsDispatchComponent implements OnInit {
  private readonly logisticsService = inject(LogisticsService);
  readonly Math = Math;

  // Sub-pestañas del módulo
  activeTab = signal<'route' | 'printable' | 'fleet'>('route');

  // Inicialización dinámica con la fecha del día
  startDate = signal<string>(getCurrentMonthStart());
  endDate = signal<string>(getCurrentMonthEnd());
  filterPreset = signal<'CURRENT' | 'AUGUST' | 'SEPTEMBER' | 'ALL' | 'CUSTOM'>('CURRENT');

  // Filtro de vehículo/zona en la hoja de ruta
  selectedVehicleFilter = signal<string>('ALL');

  routeSheet = signal<LogisticsRouteSheet | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal para confirmar entrega / cobranza en parada
  showDeliverModal = signal<boolean>(false);
  selectedStop = signal<DeliveryStop | null>(null);
  deliverAmount = signal<number>(0);
  deliverPaymentMethod = signal<string>('ACCOUNT_CREDIT');
  deliverNotes = signal<string>('');
  isSubmittingDelivery = signal<boolean>(false);

  // Flota fija refrigerada de Buen Bocado
  fleet = signal<FleetVehicle[]>([
    {
      id: 'veh-1',
      name: 'Furgón Térmico 1',
      model: 'Renault Master L2H2 Frío Alimentario',
      licensePlate: 'AF-402-BB',
      driverName: 'Carlos Gómez',
      driverPhone: '11-4567-8901',
      capacityUnits: 800,
      temperatureCelsius: 2.3,
      status: 'EN_REPARTO'
    },
    {
      id: 'veh-2',
      name: 'Furgón Térmico 2',
      model: 'Peugeot Partner Confort Isotérmica',
      licensePlate: 'AG-119-BB',
      driverName: 'Martín Díaz',
      driverPhone: '11-4567-8902',
      capacityUnits: 450,
      temperatureCelsius: 3.8,
      status: 'EN_REPARTO'
    },
    {
      id: 'veh-3',
      name: 'Moto Express Reabastecimiento',
      model: 'Honda GLH 150 con Caja Térmica',
      licensePlate: 'A-088-BB',
      driverName: 'Lucas Rossi',
      driverPhone: '11-4567-8903',
      capacityUnits: 80,
      temperatureCelsius: 4.1,
      status: 'DISPONIBLE'
    }
  ]);

  ngOnInit(): void {
    this.loadData();
  }

  applyDateFilter(preset?: 'CURRENT' | 'AUGUST' | 'SEPTEMBER' | 'ALL'): void {
    if (preset) {
      this.filterPreset.set(preset);
      if (preset === 'CURRENT') {
        this.startDate.set(getCurrentMonthStart());
        this.endDate.set(getCurrentMonthEnd());
      } else if (preset === 'AUGUST') {
        this.startDate.set('2026-08-01');
        this.endDate.set('2026-08-31');
      } else if (preset === 'SEPTEMBER') {
        this.startDate.set('2026-09-01');
        this.endDate.set('2026-09-30');
      } else if (preset === 'ALL') {
        this.startDate.set('2026-01-01');
        this.endDate.set('2026-12-31');
      }
    } else {
      this.filterPreset.set('CUSTOM');
    }
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.logisticsService.getRouteSheet(this.startDate(), this.endDate()).subscribe({
      next: (sheet) => {
        this.routeSheet.set(sheet);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando hoja de ruta de logística:', err);
        this.errorMessage.set('No se pudo cargar la hoja de ruta desde el servidor Spring Boot.');
        this.isLoading.set(false);
      }
    });
  }

  getFilteredStops(): DeliveryStop[] {
    const sheet = this.routeSheet();
    if (!sheet || !sheet.stops) return [];
    const filter = this.selectedVehicleFilter();
    if (filter === 'ALL') return sheet.stops;
    return sheet.stops.filter(s => s.assignedVehicle.includes(filter));
  }

  openGoogleMaps(address: string): void {
    const query = encodeURIComponent(`${address}, Buenos Aires, Argentina`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }

  printRouteSheet(): void {
    window.print();
  }

  // Cambio de estado rápido (Iniciar ruta / Rechazar)
  updateStatus(stop: DeliveryStop, newStatus: 'IN_TRANSIT' | 'REJECTED'): void {
    this.logisticsService.updateDeliveryStatus(stop.orderId, newStatus).subscribe({
      next: () => {
        stop.status = newStatus;
        this.showToast(`Estado de entrega actualizado a: ${newStatus}`);
        this.loadData();
      },
      error: () => this.errorMessage.set('Error al actualizar estado en el servidor.')
    });
  }

  // Modal para entrega con cobranza
  openDeliverModal(stop: DeliveryStop): void {
    this.selectedStop.set(stop);
    this.deliverAmount.set(stop.paymentMethod === 'ACCOUNT_CREDIT' ? 0 : stop.totalAmount);
    this.deliverPaymentMethod.set(stop.paymentMethod || 'ACCOUNT_CREDIT');
    this.deliverNotes.set('');
    this.showDeliverModal.set(true);
  }

  closeDeliverModal(): void {
    this.showDeliverModal.set(false);
    this.selectedStop.set(null);
  }

  confirmDelivery(): void {
    const stop = this.selectedStop();
    if (!stop) return;

    this.isSubmittingDelivery.set(true);
    this.logisticsService.confirmDelivery(
      stop.orderId,
      this.deliverAmount(),
      this.deliverPaymentMethod(),
      this.deliverNotes()
    ).subscribe({
      next: () => {
        this.isSubmittingDelivery.set(false);
        this.closeDeliverModal();
        this.showToast(`Entrega asentada exitosamente para ${stop.clientBusinessName}.`);
        this.loadData();
      },
      error: () => {
        this.isSubmittingDelivery.set(false);
        this.errorMessage.set('Error al registrar la entrega.');
      }
    });
  }

  showToast(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4500);
  }
}
