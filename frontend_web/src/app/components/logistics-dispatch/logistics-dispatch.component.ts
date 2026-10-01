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

  // --- CRUD FLOTA DE REPARTIDORES & VEHÍCULOS ---
  showVehicleModal = signal<boolean>(false);
  isEditingVehicle = signal<boolean>(false);
  vehicleForm = {
    id: '',
    name: '',
    model: '',
    licensePlate: '',
    driverName: '',
    driverPhone: '',
    capacityUnits: 500,
    temperatureCelsius: 3.0,
    status: 'DISPONIBLE' as any
  };

  openCreateVehicleModal(): void {
    this.isEditingVehicle.set(false);
    this.vehicleForm = {
      id: 'veh-' + Date.now(),
      name: 'Furgón Térmico ' + (this.fleet().length + 1),
      model: '',
      licensePlate: '',
      driverName: '',
      driverPhone: '',
      capacityUnits: 500,
      temperatureCelsius: 3.0,
      status: 'DISPONIBLE'
    };
    this.showVehicleModal.set(true);
  }

  openEditVehicleModal(veh: FleetVehicle): void {
    this.isEditingVehicle.set(true);
    this.vehicleForm = {
      id: veh.id,
      name: veh.name,
      model: veh.model,
      licensePlate: veh.licensePlate,
      driverName: veh.driverName,
      driverPhone: veh.driverPhone,
      capacityUnits: veh.capacityUnits,
      temperatureCelsius: veh.temperatureCelsius,
      status: veh.status
    };
    this.showVehicleModal.set(true);
  }

  closeVehicleModal(): void {
    this.showVehicleModal.set(false);
  }

  saveVehicle(): void {
    if (!this.vehicleForm.name.trim() || !this.vehicleForm.driverName.trim()) {
      alert('Por favor complete el nombre del vehículo y el chofer asignado.');
      return;
    }

    if (this.isEditingVehicle()) {
      const v = this.fleet().find(item => item.id === this.vehicleForm.id);
      if (v) {
        v.name = this.vehicleForm.name;
        v.model = this.vehicleForm.model;
        v.licensePlate = this.vehicleForm.licensePlate;
        v.driverName = this.vehicleForm.driverName;
        v.driverPhone = this.vehicleForm.driverPhone;
        v.capacityUnits = this.vehicleForm.capacityUnits;
        v.temperatureCelsius = this.vehicleForm.temperatureCelsius;
        v.status = this.vehicleForm.status;
      }
      this.showToast(`Vehículo "${this.vehicleForm.name}" actualizado.`);
    } else {
      const newVeh: FleetVehicle = {
        id: this.vehicleForm.id,
        name: this.vehicleForm.name,
        model: this.vehicleForm.model || 'Furgón Térmico Refrigerado',
        licensePlate: this.vehicleForm.licensePlate || 'AF-' + Math.floor(100 + Math.random() * 900) + '-BB',
        driverName: this.vehicleForm.driverName,
        driverPhone: this.vehicleForm.driverPhone || '11-4567-8900',
        capacityUnits: this.vehicleForm.capacityUnits,
        temperatureCelsius: this.vehicleForm.temperatureCelsius,
        status: this.vehicleForm.status
      };
      this.fleet.set([...this.fleet(), newVeh]);
      this.showToast(`Vehículo "${newVeh.name}" incorporado a la flota.`);
    }
    this.closeVehicleModal();
  }

  deleteVehicle(id: string): void {
    const v = this.fleet().find(item => item.id === id);
    if (!confirm(`¿Confirma la eliminación del vehículo "${v?.name || id}" de la flota?`)) return;
    this.fleet.set(this.fleet().filter(item => item.id !== id));
    this.showToast('Vehículo eliminado de la flota.');
  }

  toggleVehicleStatus(veh: FleetVehicle): void {
    const nextStatus = veh.status === 'FUERA_DE_SERVICIO' ? 'DISPONIBLE' : 'FUERA_DE_SERVICIO';
    veh.status = nextStatus as any;
    this.showToast(`Vehículo "${veh.name}" puesto en estado: ${nextStatus}`);
  }

  showToast(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4500);
  }
}
