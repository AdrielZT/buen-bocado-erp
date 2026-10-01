import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplyService } from '../../services/supply.service';
import {
  RawMaterialStock,
  Supplier,
  PurchaseInvoice,
  RegisterPurchasePayload,
  SupplyPlanning
} from '../../models/supply.model';
import { getTodayDateString, getCurrentMonthStart, getCurrentMonthEnd } from '../../utils/date-utils';

@Component({
  selector: 'app-supply-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supply-management.component.html',
  styleUrls: ['./supply-management.component.scss']
})
export class SupplyManagementComponent implements OnInit {
  private readonly supplyService = inject(SupplyService);

  activeTab: 'stock' | 'purchases' | 'suppliers' | 'planning' = 'stock';
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Data lists
  rawMaterials: RawMaterialStock[] = [];
  suppliers: Supplier[] = [];
  purchases: PurchaseInvoice[] = [];
  planning: SupplyPlanning | null = null;

  // Date Filtering: Por defecto inicializado dinámicamente al mes en curso del día de ingreso
  startDate = getCurrentMonthStart();
  endDate = getCurrentMonthEnd();
  filterPreset: 'CURRENT' | 'AUGUST' | 'SEPTEMBER' | 'ALL' | 'CUSTOM' = 'CURRENT';

  // Stats
  totalStockValue = 0;
  criticalMaterialsCount = 0;
  totalPurchasesAmount = 0;

  // Modal: Registrar Compra
  showPurchaseModal = false;
  purchasePayload: RegisterPurchasePayload = {
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().substring(0, 10),
    paymentStatus: 'PAID',
    items: [
      { rawMaterialId: '', quantity: 1, unitPrice: 0 }
    ]
  };

  // Modal: Nuevo Proveedor
  showSupplierModal = false;
  newSupplier = {
    businessName: '',
    taxId: '',
    contactPhone: '',
    email: ''
  };

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.supplyService.getRawMaterials().subscribe({
      next: (materials) => {
        this.rawMaterials = materials;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar inventario de insumos';
        this.isLoading = false;
      }
    });

    this.supplyService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        if (suppliers.length > 0 && !this.purchasePayload.supplierId) {
          this.purchasePayload.supplierId = suppliers[0].id;
        }
      }
    });

    this.loadPurchases();

    this.supplyService.getSupplyPlanning().subscribe({
      next: (plan) => {
        this.planning = plan;
      }
    });
  }

  loadPurchases(): void {
    const sDate = this.filterPreset === 'ALL' ? undefined : this.startDate;
    const eDate = this.filterPreset === 'ALL' ? undefined : this.endDate;

    this.supplyService.getPurchases(sDate, eDate).subscribe({
      next: (purchases) => {
        this.purchases = purchases;
        this.calculatePurchasesTotal();
      },
      error: () => {
        this.errorMessage = 'Error al cargar facturas de compra.';
      }
    });
  }

  applyDateFilter(preset?: 'CURRENT' | 'AUGUST' | 'SEPTEMBER' | 'ALL'): void {
    if (preset) {
      this.filterPreset = preset;
      if (preset === 'CURRENT') {
        this.startDate = getCurrentMonthStart();
        this.endDate = getCurrentMonthEnd();
      } else if (preset === 'AUGUST') {
        this.startDate = '2026-08-01';
        this.endDate = '2026-08-31';
      } else if (preset === 'SEPTEMBER') {
        this.startDate = '2026-09-01';
        this.endDate = '2026-09-30';
      }
    } else {
      this.filterPreset = 'CUSTOM';
    }
    this.loadPurchases();
  }

  calculateStats(): void {
    this.totalStockValue = this.rawMaterials.reduce((acc, m) => acc + (m.totalValue || 0), 0);
    this.criticalMaterialsCount = this.rawMaterials.filter(m => m.stockStatus !== 'OPTIMO').length;
  }

  calculatePurchasesTotal(): void {
    this.totalPurchasesAmount = this.purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  }

  // Helper calculation for purchase modal
  calculateModalTotal(): number {
    return this.purchasePayload.items.reduce((acc, item) => {
      return acc + ((item.quantity || 0) * (item.unitPrice || 0));
    }, 0);
  }

  onMaterialChange(index: number): void {
    const item = this.purchasePayload.items[index];
    const selectedMat = this.rawMaterials.find(m => m.id === item.rawMaterialId);
    if (selectedMat && (!item.unitPrice || item.unitPrice === 0)) {
      item.unitPrice = selectedMat.lastPurchasePrice;
    }
  }

  addPurchaseItemLine(): void {
    const firstMatId = this.rawMaterials.length > 0 ? this.rawMaterials[0].id : '';
    const defaultPrice = this.rawMaterials.length > 0 ? this.rawMaterials[0].lastPurchasePrice : 0;
    this.purchasePayload.items.push({
      rawMaterialId: firstMatId,
      quantity: 1,
      unitPrice: defaultPrice
    });
  }

  removePurchaseItemLine(index: number): void {
    if (this.purchasePayload.items.length > 1) {
      this.purchasePayload.items.splice(index, 1);
    }
  }

  openPurchaseModal(preselectedSupplierId?: string): void {
    this.showPurchaseModal = true;
    this.purchasePayload.invoiceNumber = `FAC-A-${Math.floor(1000 + Math.random() * 9000)}`;
    this.purchasePayload.invoiceDate = new Date().toISOString().substring(0, 10);
    if (preselectedSupplierId) {
      this.purchasePayload.supplierId = preselectedSupplierId;
    } else if (this.suppliers.length > 0 && !this.purchasePayload.supplierId) {
      this.purchasePayload.supplierId = this.suppliers[0].id;
    }

    if (this.rawMaterials.length > 0 && this.purchasePayload.items.length > 0) {
      this.purchasePayload.items[0].rawMaterialId = this.rawMaterials[0].id;
      this.purchasePayload.items[0].unitPrice = this.rawMaterials[0].lastPurchasePrice;
    }
  }

  closePurchaseModal(): void {
    this.showPurchaseModal = false;
  }

  submitPurchase(): void {
    if (!this.purchasePayload.supplierId) {
      this.errorMessage = 'Debe seleccionar un proveedor válido';
      return;
    }

    this.isLoading = true;
    this.supplyService.registerPurchase(this.purchasePayload).subscribe({
      next: (invoice) => {
        this.isLoading = false;
        this.closePurchaseModal();
        this.showSuccessNotification(`Factura ${invoice.invoiceNumber} registrada exitosamente. ¡Stock actualizado en cámara de frío!`);
        this.loadAllData();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al registrar la factura de compra.';
      }
    });
  }

  openSupplierModal(): void {
    this.showSupplierModal = true;
    this.newSupplier = {
      businessName: '',
      taxId: '',
      contactPhone: '',
      email: ''
    };
  }

  closeSupplierModal(): void {
    this.showSupplierModal = false;
  }

  submitSupplier(): void {
    if (!this.newSupplier.businessName.trim()) {
      this.errorMessage = 'La razón social del proveedor es requerida.';
      return;
    }

    this.isLoading = true;
    this.supplyService.createSupplier(this.newSupplier).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.closeSupplierModal();
        this.showSuccessNotification(`Proveedor "${created.businessName}" creado exitosamente.`);
        this.loadAllData();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al registrar el proveedor.';
      }
    });
  }

  showSuccessNotification(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = null;
    }, 4500);
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'PAN': return '#f59e0b';
      case 'FIAMBRE': return '#ef4444';
      case 'QUESO': return '#eab308';
      case 'ADEREZO': return '#10b981';
      case 'PACKAGING': return '#6366f1';
      default: return '#64748b';
    }
  }

  getStockPercentage(current: number, min: number): number {
    if (!min || min === 0) return 100;
    const pct = Math.round((current / (min * 2)) * 100);
    return Math.min(100, Math.max(0, pct));
  }
}
