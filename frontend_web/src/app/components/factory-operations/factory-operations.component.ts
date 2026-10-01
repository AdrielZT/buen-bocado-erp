import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FinanceDashboard, ClientOption, ProductOption, ReturnItem } from '../../models/finance.model';
import { getTodayDateString, getCurrentMonthStart, getCurrentMonthEnd } from '../../utils/date-utils';

export interface ProductionOrder {
  id: string;
  batchNumber: string;
  productName: string;
  category: string;
  orderType: 'MTO_B2B' | 'MTS_STOCK';
  targetUnits: number;
  completedUnits: number;
  scheduledDate: string;
  status: 'PLANIFICADO' | 'EN_COCCION' | 'ENVASADO_EN_FRIO';
}

export interface RecipeBOM {
  id: string;
  productName: string;
  category: string;
  yieldUnits: number;
  estimatedCostPerUnit: number;
  shelfLifeDays: number;
  ingredients: {
    rawMaterialName: string;
    quantity: number;
    unitOfMeasure: string;
    unitCost: number;
  }[];
}

export interface ProductionLogEntry {
  id: string;
  date: string;
  shift: string;
  operatorsCount: number;
  hoursWorked: number;
  pebetesUnits: number;
  triplesUnits: number;
  otherUnits?: number;
  productivity: number; // u / h-h
}

@Component({
  selector: 'app-factory-operations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factory-operations.component.html',
  styleUrls: ['./factory-operations.component.scss']
})
export class FactoryOperationsComponent implements OnInit {
  private readonly financeService = inject(FinanceService);

  // Sub-pestañas canónicas de Fábrica
  activeTab = signal<'batches' | 'recipes' | 'daily_logs' | 'returns'>('batches');

  // Inicializado dinámicamente con la fecha actual del día de acceso
  startDate = signal<string>(getCurrentMonthStart());
  endDate = signal<string>(getCurrentMonthEnd());
  filterPreset = signal<'CURRENT' | 'AUGUST' | 'SEPTEMBER' | 'ALL' | 'CUSTOM'>('CURRENT');

  dashboard = signal<FinanceDashboard | null>(null);
  clients = signal<ClientOption[]>([]);
  products = signal<ProductOption[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // 1. Órdenes de Fabricación Híbridas (MTO + MTS)
  productionOrders = signal<ProductionOrder[]>([
    {
      id: 'ord-101',
      batchNumber: 'L-202609-28-A',
      productName: 'Pebete Clásico Jamón y Queso',
      category: 'PEBETE',
      orderType: 'MTO_B2B',
      targetUnits: 350,
      completedUnits: 350,
      scheduledDate: '2026-09-28',
      status: 'ENVASADO_EN_FRIO'
    },
    {
      id: 'ord-102',
      batchNumber: 'L-202609-28-B',
      productName: 'Triple de Miga Jamón y Queso (Pack x3)',
      category: 'TRIPLE_MIGA',
      orderType: 'MTO_B2B',
      targetUnits: 250,
      completedUnits: 250,
      scheduledDate: '2026-09-28',
      status: 'ENVASADO_EN_FRIO'
    },
    {
      id: 'ord-103',
      batchNumber: 'L-202609-29-STOCK',
      productName: 'Docenas Triples Miga (Venta Rápida Redes)',
      category: 'TRIPLE_MIGA',
      orderType: 'MTS_STOCK',
      targetUnits: 60,
      completedUnits: 45,
      scheduledDate: '2026-09-29',
      status: 'EN_COCCION'
    },
    {
      id: 'ord-104',
      batchNumber: 'L-202609-29-PIZ',
      productName: 'Pizza Fría Muzzarella Pre-horneada',
      category: 'PIZZA_FRIA',
      orderType: 'MTS_STOCK',
      targetUnits: 40,
      completedUnits: 0,
      scheduledDate: '2026-09-29',
      status: 'PLANIFICADO'
    }
  ]);

  // Modal Nueva Orden de Fabricación
  showBatchModal = signal<boolean>(false);
  newBatchProduct = signal<string>('Pebete Clásico Jamón y Queso');
  newBatchCategory = signal<string>('PEBETE');
  newBatchType = signal<'MTO_B2B' | 'MTS_STOCK'>('MTO_B2B');
  newBatchUnits = signal<number>(200);
  newBatchDate = signal<string>(getTodayDateString());

  // 2. Recetas Maestras Dinámicas (BOM)
  recipes = signal<RecipeBOM[]>([
    {
      id: 'rec-1',
      productName: 'Pebete Clásico Jamón y Queso',
      category: 'PEBETE',
      yieldUnits: 1,
      estimatedCostPerUnit: 620,
      shelfLifeDays: 5,
      ingredients: [
        { rawMaterialName: 'Pan de Pebete Artesanal', quantity: 1, unitOfMeasure: 'UNIDAD', unitCost: 180 },
        { rawMaterialName: 'Jamón Cocido Primera', quantity: 0.045, unitOfMeasure: 'KG', unitCost: 189 },
        { rawMaterialName: 'Queso Tybo Especial', quantity: 0.045, unitOfMeasure: 'KG', unitCost: 175.5 },
        { rawMaterialName: 'Mayonesa Emulsionada', quantity: 0.015, unitOfMeasure: 'LITRO', unitCost: 16.5 },
        { rawMaterialName: 'Bolsa y Cierre Packaging', quantity: 1, unitOfMeasure: 'UNIDAD', unitCost: 59 }
      ]
    },
    {
      id: 'rec-2',
      productName: 'Triple de Miga Jamón y Queso (Pack x3)',
      category: 'TRIPLE_MIGA',
      yieldUnits: 1,
      estimatedCostPerUnit: 910,
      shelfLifeDays: 5,
      ingredients: [
        { rawMaterialName: 'Pan de Miga Blanco Extra Fresco', quantity: 0.12, unitOfMeasure: 'KG', unitCost: 168 },
        { rawMaterialName: 'Jamón Cocido Primera', quantity: 0.08, unitOfMeasure: 'KG', unitCost: 336 },
        { rawMaterialName: 'Queso Tybo Especial', quantity: 0.075, unitOfMeasure: 'KG', unitCost: 292.5 },
        { rawMaterialName: 'Mayonesa Emulsionada', quantity: 0.02, unitOfMeasure: 'LITRO', unitCost: 22 },
        { rawMaterialName: 'Film Termosellable Microperforado', quantity: 1, unitOfMeasure: 'UNIDAD', unitCost: 91.5 }
      ]
    },
    {
      id: 'rec-3',
      productName: 'Pizza Fría Muzzarella Artesanal (Pre-horneada)',
      category: 'PIZZA_FRIA',
      yieldUnits: 1,
      estimatedCostPerUnit: 1850,
      shelfLifeDays: 4,
      ingredients: [
        { rawMaterialName: 'Prepizza de Masa Madre', quantity: 1, unitOfMeasure: 'UNIDAD', unitCost: 450 },
        { rawMaterialName: 'Salsa de Tomate Especiada', quantity: 0.12, unitOfMeasure: 'LITRO', unitCost: 180 },
        { rawMaterialName: 'Queso Muzzarella en Barra', quantity: 0.25, unitOfMeasure: 'KG', unitCost: 1050 },
        { rawMaterialName: 'Aceitunas Verdes y Orégano', quantity: 1, unitOfMeasure: 'PORCION', unitCost: 90 },
        { rawMaterialName: 'Bolsa Termocontraíble', quantity: 1, unitOfMeasure: 'UNIDAD', unitCost: 80 }
      ]
    }
  ]);

  // 3. Partes Diarios de Cocina (Incluye Agosto y Septiembre)
  productionLogs = signal<ProductionLogEntry[]>([
    { id: 'log-aug-1', date: '2026-08-07', shift: 'MAÑANA', operatorsCount: 3, hoursWorked: 6, pebetesUnits: 250, triplesUnits: 150, otherUnits: 20, productivity: 23.3 },
    { id: 'log-aug-2', date: '2026-08-14', shift: 'MAÑANA', operatorsCount: 3, hoursWorked: 6, pebetesUnits: 280, triplesUnits: 180, otherUnits: 15, productivity: 26.4 },
    { id: 'log-aug-3', date: '2026-08-21', shift: 'MAÑANA', operatorsCount: 3, hoursWorked: 6, pebetesUnits: 220, triplesUnits: 190, otherUnits: 10, productivity: 23.3 },
    { id: 'log-aug-4', date: '2026-08-28', shift: 'MAÑANA', operatorsCount: 3, hoursWorked: 6, pebetesUnits: 200, triplesUnits: 185, otherUnits: 25, productivity: 22.8 },
    { id: 'log-1', date: '2026-09-22', shift: 'MAÑANA', operatorsCount: 3, hoursWorked: 6, pebetesUnits: 1100, triplesUnits: 450, otherUnits: 40, productivity: 88.3 },
    { id: 'log-2', date: '2026-09-23', shift: 'TARDE', operatorsCount: 2, hoursWorked: 5, pebetesUnits: 600, triplesUnits: 300, otherUnits: 0, productivity: 90.0 },
    { id: 'log-3', date: '2026-09-24', shift: 'MAÑANA', operatorsCount: 3, hoursWorked: 6.5, pebetesUnits: 1250, triplesUnits: 500, otherUnits: 50, productivity: 92.3 },
    { id: 'log-4', date: '2026-09-25', shift: 'MAÑANA', operatorsCount: 4, hoursWorked: 7, pebetesUnits: 1500, triplesUnits: 650, otherUnits: 75, productivity: 79.5 }
  ]);

  // Modales
  showProductionModal = signal<boolean>(false);
  logDate = signal<string>(getTodayDateString());
  logShift = signal<string>('MAÑANA');
  logOperators = signal<number>(3);
  logHours = signal<number>(6);
  logPebetes = signal<number>(1100);
  logTriples = signal<number>(450);

  showReturnModal = signal<boolean>(false);
  isSavingReturn = signal<boolean>(false);
  returnError = signal<string | null>(null);
  returnClientId = signal<string>('');
  returnProductId = signal<string>('');
  returnDate = signal<string>(getTodayDateString());
  returnQuantity = signal<number | null>(5);
  returnReason = signal<string>('EXPIRED_FROZEN');

  ngOnInit(): void {
    this.loadCatalog();
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

  getFilteredProductionLogs(): ProductionLogEntry[] {
    const s = this.startDate();
    const e = this.endDate();
    return this.productionLogs().filter(log => log.date >= s && log.date <= e);
  }

  totalProducedUnitsInPeriod(): number {
    return this.getFilteredProductionLogs().reduce((acc, log) => acc + log.pebetesUnits + log.triplesUnits + (log.otherUnits || 0), 0);
  }

  averageProductivityInPeriod(): number {
    const logs = this.getFilteredProductionLogs();
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, log) => acc + log.productivity, 0);
    return Math.round((sum / logs.length) * 10) / 10;
  }

  openBatchModal(): void {
    this.showBatchModal.set(true);
    this.newBatchDate.set(getTodayDateString());
  }

  closeBatchModal(): void {
    this.showBatchModal.set(false);
  }

  saveBatchOrder(): void {
    const newOrd: ProductionOrder = {
      id: 'ord-' + Date.now(),
      batchNumber: 'L-' + this.newBatchDate().replace(/-/g, '') + '-' + (this.newBatchType() === 'MTO_B2B' ? 'B2B' : 'STK'),
      productName: this.newBatchProduct(),
      category: this.newBatchCategory(),
      orderType: this.newBatchType(),
      targetUnits: this.newBatchUnits() || 100,
      completedUnits: 0,
      scheduledDate: this.newBatchDate(),
      status: 'PLANIFICADO'
    };
    this.productionOrders.set([newOrd, ...this.productionOrders()]);
    this.closeBatchModal();
    this.showToast(`Orden de elaboración ${newOrd.batchNumber} programada con éxito.`);
  }

  loadCatalog(): void {
    this.financeService.getClients().subscribe({
      next: (cls) => {
        this.clients.set(cls);
        if (cls.length > 0) this.returnClientId.set(cls[0].id);
      }
    });

    this.financeService.getProducts().subscribe({
      next: (prs) => {
        this.products.set(prs);
        if (prs.length > 0) this.returnProductId.set(prs[0].id);
      }
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.financeService.getDashboard(this.startDate(), this.endDate()).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo conectar con el servidor.');
        this.isLoading.set(false);
      }
    });
  }

  // Métodos de Órdenes de Fabricación
  advanceOrderStatus(order: ProductionOrder): void {
    if (order.status === 'PLANIFICADO') {
      order.status = 'EN_COCCION';
      this.showToast(`Orden #${order.batchNumber} pasó a elaboración activa en cocina.`);
    } else if (order.status === 'EN_COCCION') {
      order.status = 'ENVASADO_EN_FRIO';
      order.completedUnits = order.targetUnits;
      this.showToast(`¡Lote #${order.batchNumber} finalizado y almacenado en cámara de frío (5 días)!`);
    }
  }

  // Métodos de Partes Diarios
  openProductionModal(): void {
    this.showProductionModal.set(true);
  }

  closeProductionModal(): void {
    this.showProductionModal.set(false);
  }

  saveProductionLog(): void {
    const totalUnits = (this.logPebetes() || 0) + (this.logTriples() || 0);
    const manHours = (this.logOperators() || 1) * (this.logHours() || 1);
    const prod = parseFloat((totalUnits / manHours).toFixed(1));

    const newLog: ProductionLogEntry = {
      id: 'log-' + Date.now(),
      date: this.logDate(),
      shift: this.logShift(),
      operatorsCount: this.logOperators(),
      hoursWorked: this.logHours(),
      pebetesUnits: this.logPebetes(),
      triplesUnits: this.logTriples(),
      otherUnits: 0,
      productivity: prod
    };

    this.productionLogs.set([newLog, ...this.productionLogs()]);
    this.closeProductionModal();
    this.showToast(`Parte diario asentado con éxito: Productividad ${prod} u/h-h.`);
  }

  // Métodos de Mermas / Devoluciones
  openReturnModal(): void {
    this.showReturnModal.set(true);
    this.returnError.set(null);
  }

  closeReturnModal(): void {
    this.showReturnModal.set(false);
    this.returnError.set(null);
  }

  saveReturn(): void {
    const clientId = this.returnClientId();
    const productId = this.returnProductId();
    const qty = this.returnQuantity();

    if (!clientId || !productId || !qty || qty <= 0) {
      this.returnError.set('Por favor completa todos los campos con valores válidos.');
      return;
    }

    this.isSavingReturn.set(true);
    this.returnError.set(null);

    const payload = {
      clientId,
      productId,
      quantity: qty,
      reason: this.returnReason(),
      returnDate: this.returnDate()
    };

    this.financeService.createReturn(payload).subscribe({
      next: () => {
        this.isSavingReturn.set(false);
        this.closeReturnModal();
        this.showToast('Merma / Devolución registrada para auditoría de calidad.');
        this.loadData();
      },
      error: () => {
        this.returnError.set('Error al guardar la devolución en el servidor.');
        this.isSavingReturn.set(false);
      }
    });
  }

  deleteReturn(id: string): void {
    if (!confirm('¿Desea anular este registro de merma?')) return;

    this.financeService.deleteReturn(id).subscribe({
      next: () => {
        this.showToast('Registro eliminado con éxito.');
        this.loadData();
      },
      error: () => this.errorMessage.set('Error al eliminar registro.')
    });
  }

  showToast(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4500);
  }
}
