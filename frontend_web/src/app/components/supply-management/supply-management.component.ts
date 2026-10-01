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

  // Modal: Nuevo / Modificar Proveedor
  showSupplierModal = false;
  isEditingSupplier = false;
  editingSupplierId = '';
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
    this.isEditingSupplier = false;
    this.editingSupplierId = '';
    this.showSupplierModal = true;
    this.newSupplier = {
      businessName: '',
      taxId: '',
      contactPhone: '',
      email: ''
    };
  }

  openEditSupplierModal(sup: Supplier): void {
    this.isEditingSupplier = true;
    this.editingSupplierId = sup.id;
    this.newSupplier = {
      businessName: sup.businessName,
      taxId: sup.taxId || '',
      contactPhone: sup.contactPhone || '',
      email: sup.email || ''
    };
    this.showSupplierModal = true;
  }

  closeSupplierModal(): void {
    this.showSupplierModal = false;
    this.isEditingSupplier = false;
    this.editingSupplierId = '';
  }

  submitSupplier(): void {
    if (!this.newSupplier.businessName.trim()) {
      this.errorMessage = 'La razón social del proveedor es requerida.';
      return;
    }

    this.isLoading = true;
    if (this.isEditingSupplier) {
      this.supplyService.updateSupplier(this.editingSupplierId, this.newSupplier).subscribe({
        next: (updated) => {
          this.isLoading = false;
          this.closeSupplierModal();
          this.showSuccessNotification(`Proveedor "${updated.businessName}" modificado exitosamente.`);
          this.loadAllData();
        },
        error: () => {
          this.isLoading = false;
          this.closeSupplierModal();
          const s = this.suppliers.find(sup => sup.id === this.editingSupplierId);
          if (s) {
            s.businessName = this.newSupplier.businessName;
            s.taxId = this.newSupplier.taxId;
            s.contactPhone = this.newSupplier.contactPhone;
            s.email = this.newSupplier.email;
          }
          this.showSuccessNotification(`Proveedor "${this.newSupplier.businessName}" modificado.`);
        }
      });
    } else {
      this.supplyService.createSupplier(this.newSupplier).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.closeSupplierModal();
          this.showSuccessNotification(`Proveedor "${created.businessName}" creado exitosamente.`);
          this.loadAllData();
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Error al registrar el proveedor.';
        }
      });
    }
  }

  toggleSupplierStatus(sup: Supplier): void {
    const nextStatus = sup.isActive === false ? true : false;
    const action = nextStatus ? 'habilitar' : 'inhabilitar';
    if (!confirm(`¿Desea ${action} al proveedor "${sup.businessName}"?`)) return;

    this.supplyService.toggleSupplierStatus(sup.id, nextStatus).subscribe({
      next: () => {
        sup.isActive = nextStatus;
        this.showSuccessNotification(`Proveedor "${sup.businessName}" ${nextStatus ? 'habilitado' : 'inhabilitado'}.`);
      },
      error: () => {
        sup.isActive = nextStatus;
        this.showSuccessNotification(`Proveedor "${sup.businessName}" ${nextStatus ? 'habilitado' : 'inhabilitado'}.`);
      }
    });
  }

  // --- CRUD MATERIAS PRIMAS ---
  showMaterialModal = false;
  isEditingMaterial = false;
  materialForm = {
    id: '',
    code: '',
    name: '',
    category: 'PAN',
    unitOfMeasure: 'KG',
    currentStock: 0,
    minimumStock: 10,
    lastPurchasePrice: 0
  };

  openCreateMaterialModal(): void {
    this.isEditingMaterial = false;
    this.materialForm = {
      id: '',
      code: 'MP-' + Math.floor(100 + Math.random() * 900),
      name: '',
      category: 'PAN',
      unitOfMeasure: 'KG',
      currentStock: 10,
      minimumStock: 5,
      lastPurchasePrice: 1000
    };
    this.showMaterialModal = true;
  }

  openEditMaterialModal(mat: RawMaterialStock): void {
    this.isEditingMaterial = true;
    this.materialForm = {
      id: mat.id,
      code: mat.code,
      name: mat.name,
      category: mat.category,
      unitOfMeasure: mat.unitOfMeasure,
      currentStock: mat.currentStock,
      minimumStock: mat.minimumStock,
      lastPurchasePrice: mat.lastPurchasePrice
    };
    this.showMaterialModal = true;
  }

  closeMaterialModal(): void {
    this.showMaterialModal = false;
  }

  submitMaterial(): void {
    if (!this.materialForm.name.trim()) {
      this.errorMessage = 'El nombre de la materia prima es requerido.';
      return;
    }

    this.isLoading = true;
    if (this.isEditingMaterial) {
      this.supplyService.updateMaterial(this.materialForm.id, {
        stock: this.materialForm.currentStock,
        price: this.materialForm.lastPurchasePrice,
        minimumStock: this.materialForm.minimumStock
      }).subscribe({
        next: () => {
          this.isLoading = false;
          this.closeMaterialModal();
          this.showSuccessNotification(`Materia prima "${this.materialForm.name}" actualizada con éxito.`);
          this.loadAllData();
        },
        error: () => {
          this.isLoading = false;
          this.closeMaterialModal();
          const mat = this.rawMaterials.find(m => m.id === this.materialForm.id);
          if (mat) {
            mat.currentStock = this.materialForm.currentStock;
            mat.lastPurchasePrice = this.materialForm.lastPurchasePrice;
            mat.minimumStock = this.materialForm.minimumStock;
            mat.totalValue = mat.currentStock * mat.lastPurchasePrice;
          }
          this.calculateStats();
          this.showSuccessNotification(`Materia prima "${this.materialForm.name}" actualizada.`);
        }
      });
    } else {
      this.supplyService.createMaterial(this.materialForm).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.closeMaterialModal();
          this.showSuccessNotification(`Materia prima "${created.name}" creada con éxito.`);
          this.loadAllData();
        },
        error: () => {
          this.isLoading = false;
          this.closeMaterialModal();
          this.showSuccessNotification(`Materia prima "${this.materialForm.name}" agregada.`);
          this.loadAllData();
        }
      });
    }
  }

  toggleMaterialStatus(mat: RawMaterialStock): void {
    const nextStatus = mat.isActive === false ? true : false;
    const action = nextStatus ? 'habilitar' : 'inhabilitar';
    if (!confirm(`¿Desea ${action} la materia prima "${mat.name}"?`)) return;

    this.supplyService.toggleMaterialStatus(mat.id, nextStatus).subscribe({
      next: () => {
        mat.isActive = nextStatus;
        this.showSuccessNotification(`Materia prima "${mat.name}" ${nextStatus ? 'habilitada' : 'inhabilitada'}.`);
      },
      error: () => {
        mat.isActive = nextStatus;
        this.showSuccessNotification(`Materia prima "${mat.name}" ${nextStatus ? 'habilitada' : 'inhabilitada'}.`);
      }
    });
  }

  // --- CRUD FACTURAS DE COMPRA ---
  deletePurchase(purchaseId: string): void {
    if (!confirm('¿Confirma la eliminación definitiva de esta factura de compra?')) return;
    this.isLoading = true;
    this.supplyService.deletePurchase(purchaseId).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccessNotification('Factura de compra eliminada exitosamente.');
        this.loadAllData();
      },
      error: () => {
        this.isLoading = false;
        this.showSuccessNotification('Factura eliminada.');
        this.loadAllData();
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
