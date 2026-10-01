import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogProduct, ProductType } from '../../models/catalog.model';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.scss']
})
export class ProductCatalogComponent implements OnInit {
  private readonly financeService = inject(FinanceService);

  activeTab = signal<'manufactured' | 'resale' | 'bundles' | 'freshness'>('manufactured');
  successMessage = signal<string | null>(null);

  // Catálogo Maestro
  products = signal<CatalogProduct[]>([
    // ELABORADOS PROPIOS (Sándwiches + Nuevas líneas de prueba)
    {
      id: 'prod-001',
      sku: 'SAN-PEB-JYQ',
      name: 'Pebete Clásico Jamón y Queso',
      category: 'PEBETE',
      productType: 'MANUFACTURED',
      baseUnitPrice: 1500,
      costPrice: 620,
      currentStock: 120,
      shelfLifeDays: 5,
      batchAgeDays: 1,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'UNIDAD',
      isActive: true
    },
    {
      id: 'prod-002',
      sku: 'SAN-PEB-SYQ',
      name: 'Pebete Salame Milán y Queso',
      category: 'PEBETE',
      productType: 'MANUFACTURED',
      baseUnitPrice: 1600,
      costPrice: 680,
      currentStock: 85,
      shelfLifeDays: 5,
      batchAgeDays: 2,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'UNIDAD',
      isActive: true
    },
    {
      id: 'prod-003',
      sku: 'SAN-MIG-JYQ',
      name: 'Triple de Miga Jamón y Queso (Pack x3)',
      category: 'TRIPLE_MIGA',
      productType: 'MANUFACTURED',
      baseUnitPrice: 2200,
      costPrice: 910,
      currentStock: 160,
      shelfLifeDays: 5,
      batchAgeDays: 3,
      freshnessStatus: 'ROTACION_URGENTE',
      unitOfMeasure: 'PACK_X3',
      isActive: true
    },
    {
      id: 'prod-004',
      sku: 'SAN-MIL-COM',
      name: 'Sándwich de Milanesa Completo',
      category: 'MILANESA',
      productType: 'MANUFACTURED',
      baseUnitPrice: 3200,
      costPrice: 1450,
      currentStock: 30,
      shelfLifeDays: 2,
      batchAgeDays: 1,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'UNIDAD',
      isActive: true
    },
    {
      id: 'prod-005',
      sku: 'PIZ-MUZ-FRI',
      name: 'Pizza Fría Muzzarella Artesanal (Pre-horneada)',
      category: 'PIZZA_FRIA',
      productType: 'MANUFACTURED',
      baseUnitPrice: 4500,
      costPrice: 1850,
      currentStock: 45,
      shelfLifeDays: 4,
      batchAgeDays: 1,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'UNIDAD',
      isActive: true
    },
    {
      id: 'prod-006',
      sku: 'POS-FLA-CAS',
      name: 'Flan Casero con Dulce de Leche en Pote',
      category: 'POSTRE',
      productType: 'MANUFACTURED',
      baseUnitPrice: 1800,
      costPrice: 720,
      currentStock: 50,
      shelfLifeDays: 7,
      batchAgeDays: 2,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'POTE',
      isActive: true
    },
    {
      id: 'prod-007',
      sku: 'JUG-NAR-EXP',
      name: 'Jugo Natural de Naranja Exprimido (500ml)',
      category: 'JUGO',
      productType: 'MANUFACTURED',
      baseUnitPrice: 1900,
      costPrice: 750,
      currentStock: 40,
      shelfLifeDays: 2,
      batchAgeDays: 1,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'BOTELLA',
      isActive: true
    },

    // MERCADERÍA DE REVENTA
    {
      id: 'res-001',
      sku: 'BEB-COC-150',
      name: 'Coca-Cola Sabor Original 1.5L',
      category: 'BEBIDA',
      productType: 'RESALE',
      baseUnitPrice: 2200,
      costPrice: 1450,
      currentStock: 96,
      shelfLifeDays: 180,
      batchAgeDays: 15,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'BOTELLA',
      isActive: true
    },
    {
      id: 'res-002',
      sku: 'BEB-SPR-500',
      name: 'Sprite Lima-Limón 500ml',
      category: 'BEBIDA',
      productType: 'RESALE',
      baseUnitPrice: 1400,
      costPrice: 890,
      currentStock: 120,
      shelfLifeDays: 180,
      batchAgeDays: 20,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'BOTELLA',
      isActive: true
    },
    {
      id: 'res-003',
      sku: 'SNK-PAP-LAYS',
      name: 'Papas Fritas Clásicas 85g',
      category: 'SNACK',
      productType: 'RESALE',
      baseUnitPrice: 1600,
      costPrice: 950,
      currentStock: 75,
      shelfLifeDays: 120,
      batchAgeDays: 12,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'PAQUETE',
      isActive: true
    },

    // COMBOS Y PACKS PROMOCIONALES (Explosión dinámica de inventario)
    {
      id: 'bun-001',
      sku: 'CMB-CUMPLE-01',
      name: 'Combo Fiesta: 2 Docenas Triples + Coca 1.5L',
      category: 'COMBO',
      productType: 'BUNDLE',
      baseUnitPrice: 18500,
      costPrice: 8730,
      currentStock: 40,
      shelfLifeDays: 5,
      unitOfMeasure: 'COMBO',
      isActive: true,
      bundleItems: [
        { productId: 'prod-003', productName: 'Triples de Miga (8 packs x3 = 24u)', quantity: 8 },
        { productId: 'res-001', productName: 'Coca-Cola 1.5L', quantity: 1 }
      ]
    },
    {
      id: 'bun-002',
      sku: 'CMB-ALMUERZO-01',
      name: 'Promo Almuerzo Kiosco: Pebete JyQ + Sprite 500ml',
      category: 'COMBO',
      productType: 'BUNDLE',
      baseUnitPrice: 2600,
      costPrice: 1510,
      currentStock: 80,
      shelfLifeDays: 5,
      unitOfMeasure: 'COMBO',
      isActive: true,
      bundleItems: [
        { productId: 'prod-001', productName: 'Pebete Clásico JyQ', quantity: 1 },
        { productId: 'res-002', productName: 'Sprite 500ml', quantity: 1 }
      ]
    }
  ]);

  // Modales
  showCreateModal = signal<boolean>(false);
  newProductType = signal<ProductType>('MANUFACTURED');
  newProductSku = signal<string>('');
  newProductName = signal<string>('');
  newProductCategory = signal<string>('PEBETE');
  newProductPrice = signal<number>(1800);
  newProductCost = signal<number>(800);
  newProductStock = signal<number>(50);
  newProductShelfLife = signal<number>(5);

  ngOnInit(): void {}

  getManufacturedProducts(): CatalogProduct[] {
    return this.products().filter(p => p.productType === 'MANUFACTURED');
  }

  getResaleProducts(): CatalogProduct[] {
    return this.products().filter(p => p.productType === 'RESALE');
  }

  getBundleProducts(): CatalogProduct[] {
    return this.products().filter(p => p.productType === 'BUNDLE');
  }

  openCreateModal(type: ProductType): void {
    this.newProductType.set(type);
    this.newProductSku.set(type === 'MANUFACTURED' ? 'ELAB-' + Math.floor(100 + Math.random() * 900) : 'REV-' + Math.floor(100 + Math.random() * 900));
    this.newProductName.set('');
    this.newProductPrice.set(1800);
    this.newProductCost.set(800);
    this.newProductStock.set(50);
    this.newProductShelfLife.set(type === 'MANUFACTURED' ? 5 : 180);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  saveNewProduct(): void {
    if (!this.newProductName().trim()) return;

    const newProd: CatalogProduct = {
      id: 'prod-' + Date.now(),
      sku: this.newProductSku().trim() || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: this.newProductName().trim(),
      category: this.newProductCategory(),
      productType: this.newProductType(),
      baseUnitPrice: this.newProductPrice(),
      costPrice: this.newProductCost(),
      currentStock: this.newProductStock(),
      shelfLifeDays: this.newProductShelfLife(),
      batchAgeDays: 1,
      freshnessStatus: 'OPTIMA',
      unitOfMeasure: 'UNIDAD',
      isActive: true
    };

    this.products.set([newProd, ...this.products()]);
    this.closeCreateModal();
    this.showSuccessNotification(`Producto "${newProd.name}" incorporado exitosamente al catálogo.`);
  }

  // Modal Modificar Producto
  showEditModal = signal<boolean>(false);
  editingProduct = signal<CatalogProduct | null>(null);
  editForm = {
    name: '',
    sku: '',
    category: '',
    baseUnitPrice: 0,
    costPrice: 0,
    currentStock: 0,
    shelfLifeDays: 5
  };

  openEditModal(p: CatalogProduct): void {
    this.editingProduct.set(p);
    this.editForm = {
      name: p.name,
      sku: p.sku,
      category: p.category,
      baseUnitPrice: p.baseUnitPrice,
      costPrice: p.costPrice,
      currentStock: p.currentStock,
      shelfLifeDays: p.shelfLifeDays
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingProduct.set(null);
  }

  saveProductEdit(): void {
    const prod = this.editingProduct();
    if (!prod) return;

    prod.name = this.editForm.name;
    prod.sku = this.editForm.sku;
    prod.category = this.editForm.category;
    prod.baseUnitPrice = this.editForm.baseUnitPrice;
    prod.costPrice = this.editForm.costPrice;
    prod.currentStock = this.editForm.currentStock;
    prod.shelfLifeDays = this.editForm.shelfLifeDays;

    // Intentar persistir en backend si tiene UUID o sincronización
    this.financeService.updateProduct(prod.id, {
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      baseUnitPrice: prod.baseUnitPrice,
      costPrice: prod.costPrice,
      shelfLifeHours: prod.shelfLifeDays * 24
    }).subscribe({
      next: () => {},
      error: () => {} // Si es ID mockeado de catálogo local, queda actualizado en memoria
    });

    this.closeEditModal();
    this.showSuccessNotification(`Producto "${prod.name}" modificado exitosamente.`);
  }

  toggleProductStatus(p: CatalogProduct): void {
    const nextStatus = !p.isActive;
    p.isActive = nextStatus;

    this.financeService.toggleProductStatus(p.id, nextStatus).subscribe({
      next: () => {},
      error: () => {}
    });

    this.showSuccessNotification(`Producto "${p.name}" ${nextStatus ? 'activado' : 'pausado para venta'}.`);
  }

  showSuccessNotification(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      this.successMessage.set(null);
    }, 4500);
  }
}
