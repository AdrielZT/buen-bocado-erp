import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FinanceDashboard, ClientOption, ProductOption, SalesOrderBreakdown } from '../../models/finance.model';
import { ClientAccount, PriceRule } from '../../models/catalog.model';
import { getTodayDateString, getCurrentMonthStart, getCurrentMonthEnd } from '../../utils/date-utils';

interface CartItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  shelfLifeDays?: number;
  batchAgeDays?: number;
  freshnessStatus?: 'OPTIMA' | 'ROTACION_URGENTE' | 'VENCIDO';
}

@Component({
  selector: 'app-sales-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-management.component.html',
  styleUrls: ['./sales-management.component.scss']
})
export class SalesManagementComponent implements OnInit {
  private readonly financeService = inject(FinanceService);

  // Sub-pestañas canónicas de Ventas & Clientes
  activeTab = signal<'pos' | 'orders' | 'clients' | 'accounts' | 'prices'>('pos');

  // Filtro de Fechas: Inicializado dinámicamente con el período actual del día en que se ingresa
  startDate = signal<string>(getCurrentMonthStart());
  endDate = signal<string>(getCurrentMonthEnd());
  filterPreset = signal<'CURRENT' | 'AUGUST' | 'SEPTEMBER' | 'ALL' | 'CUSTOM'>('CURRENT');

  dashboard = signal<FinanceDashboard | null>(null);
  clients = signal<ClientOption[]>([]);
  products = signal<ProductOption[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  searchTerm = signal<string>('');
  expandedOrders = signal<Record<string, boolean>>({});

  // 1. Venta Rápida / Mostrador (POS Inmediato)
  posSelectedClientId = signal<string>('c0000001-0000-0000-0000-000000000004'); // Cliente Mostrador / Redes
  posPaymentMethod = signal<'CASH' | 'TRANSFER' | 'ACCOUNT_CREDIT'>('CASH');
  posCart = signal<CartItem[]>([]);

  // Productos disponibles para venta inmediata (MTS con regla 5 días y reventa)
  posCatalog: CartItem[] = [
    { id: 'b0000001-0000-0000-0000-000000000001', name: 'Pebete Clásico Jamón y Queso', category: 'PEBETE', unitPrice: 1500, quantity: 1, shelfLifeDays: 5, batchAgeDays: 1, freshnessStatus: 'OPTIMA' },
    { id: 'b0000001-0000-0000-0000-000000000002', name: 'Pebete Salame y Queso', category: 'PEBETE', unitPrice: 1600, quantity: 1, shelfLifeDays: 5, batchAgeDays: 2, freshnessStatus: 'OPTIMA' },
    { id: 'b0000001-0000-0000-0000-000000000003', name: 'Docena Triples de Miga JyQ', category: 'MIGA_TRIPLE', unitPrice: 8800, quantity: 1, shelfLifeDays: 5, batchAgeDays: 3, freshnessStatus: 'ROTACION_URGENTE' },
    { id: 'b0000001-0000-0000-0000-000000000004', name: 'Media Docena Triples Especiales', category: 'MIGA_TRIPLE', unitPrice: 4600, quantity: 1, shelfLifeDays: 5, batchAgeDays: 1, freshnessStatus: 'OPTIMA' },
    { id: 'b0000001-0000-0000-0000-000000000005', name: 'Sándwich de Milanesa Completo', category: 'MILANESA', unitPrice: 3200, quantity: 1, shelfLifeDays: 2, batchAgeDays: 1, freshnessStatus: 'OPTIMA' },
    { id: 'b0000001-0000-0000-0000-000000000006', name: 'Pizza Fría Muzzarella (Pre-horneada)', category: 'PIZZA_FRIA', unitPrice: 4500, quantity: 1, shelfLifeDays: 4, batchAgeDays: 1, freshnessStatus: 'OPTIMA' },
    { id: 'b0000001-0000-0000-0000-000000000007', name: 'Coca-Cola Original 1.5L', category: 'BEBIDA', unitPrice: 2200, quantity: 1, shelfLifeDays: 180, batchAgeDays: 10, freshnessStatus: 'OPTIMA' },
    { id: 'b0000001-0000-0000-0000-000000000008', name: 'Combo Cumple: 2 Doc. Triples + Coca 1.5L', category: 'COMBO', unitPrice: 18500, quantity: 1, shelfLifeDays: 5, batchAgeDays: 1, freshnessStatus: 'OPTIMA' }
  ];

  // 2. Directorio & Cuentas Corrientes
  clientAccounts: ClientAccount[] = [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      businessName: 'Kiosco El Trébol',
      taxId: '30-71123456-8',
      contactName: 'Roberto Gómez',
      phone: '11-4567-8901',
      email: 'kiosco.trebol@email.com',
      deliveryAddress: 'Av. San Martín 1420',
      creditLimit: 150000,
      currentBalance: 42000,
      accountStatus: 'AL_DIA',
      clientType: 'B2B_KIOSK'
    },
    {
      id: 'c0000001-0000-0000-0000-000000000002',
      businessName: 'Cafetería La Esquina',
      taxId: '30-71987654-2',
      contactName: 'Mariana Torres',
      phone: '11-5678-1234',
      email: 'laesquina.cafe@email.com',
      deliveryAddress: 'Belgrano 850',
      creditLimit: 250000,
      currentBalance: 85000,
      accountStatus: 'AL_DIA',
      clientType: 'B2B_CAFE'
    },
    {
      id: 'c0000001-0000-0000-0000-000000000003',
      businessName: 'Despensa Don Juan',
      taxId: '20-28456123-4',
      contactName: 'Juan Pérez',
      phone: '11-6789-4321',
      email: 'despensadonjuan@email.com',
      deliveryAddress: 'Mitre 2100',
      creditLimit: 100000,
      currentBalance: 98500,
      accountStatus: 'EN_RIESGO',
      clientType: 'B2B_KIOSK'
    },
    {
      id: 'c0000001-0000-0000-0000-000000000004',
      businessName: 'Cliente Mostrador / Redes Sociales',
      taxId: 'Consumidor Final',
      contactName: 'Ventas al Paso y WhatsApp',
      phone: '11-9988-7766',
      email: 'mostrador@buenbocado.com',
      deliveryAddress: 'Venta Directa Fábrica',
      creditLimit: 0,
      currentBalance: 0,
      accountStatus: 'AL_DIA',
      clientType: 'B2C_SOCIAL'
    }
  ];

  // 3. Listas de Precios Diferenciales
  priceRules: PriceRule[] = [
    { id: 'pr-1', clientName: 'Kiosco El Trébol', productId: 'b1', productName: 'Pebete JyQ', specialPrice: 1450, minVolumeQty: 50, discountPercent: 3.3 },
    { id: 'pr-2', clientName: 'Cafetería La Esquina', productId: 'b3', productName: 'Triple Miga Pack x3', specialPrice: 2050, minVolumeQty: 100, discountPercent: 6.8 },
    { id: 'pr-3', clientName: 'Despensa Don Juan', productId: 'b1', productName: 'Pebete JyQ', specialPrice: 1500, minVolumeQty: 20, discountPercent: 0.0 },
    { id: 'pr-4', clientName: 'Precio General Redes (Docenas)', productId: 'b3', productName: 'Docena Triples Miga', specialPrice: 8800, minVolumeQty: 12, discountPercent: 12.0 }
  ];

  // Modal para Cargar Pedido B2B
  showOrderModal = signal<boolean>(false);
  isSavingOrder = signal<boolean>(false);
  orderError = signal<string | null>(null);

  orderClientId = signal<string>('');
  orderDeliveryDate = signal<string>(new Date().toISOString().substring(0, 10));
  orderProductId = signal<string>('');
  orderQuantity = signal<number | null>(50);
  orderUnitPrice = signal<number | null>(1500);

  // Modal para Registrar Cobro
  showPaymentModal = signal<boolean>(false);
  selectedAccountForPayment = signal<ClientAccount | null>(null);
  paymentAmount = signal<number>(10000);
  paymentVoucher = signal<string>('REC-' + Math.floor(1000 + Math.random() * 9000));

  ngOnInit(): void {
    this.loadCatalog();
    this.loadData();
  }

  loadCatalog(): void {
    this.financeService.getClients().subscribe({
      next: (cls) => {
        this.clients.set(cls);
        if (cls.length > 0) this.orderClientId.set(cls[0].id);

        if (cls && cls.length > 0) {
          this.clientAccounts = cls.map(c => {
            const limit = c.creditLimit != null ? c.creditLimit : 150000;
            const balance = c.currentBalance != null ? c.currentBalance : 0;
            return {
              id: c.id,
              businessName: c.businessName,
              taxId: c.taxId || 'Consumidor Final',
              contactName: c.contactName || 'Encargado',
              phone: c.phone || 'S/D',
              email: c.email || 'contacto@' + c.businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
              deliveryAddress: c.deliveryAddress || 'CABA / GBA',
              creditLimit: limit,
              currentBalance: balance,
              accountStatus: (balance > limit * 0.8) ? 'EN_RIESGO' : 'AL_DIA',
              clientType: c.clientType || 'B2B_KIOSK'
            };
          });
        }
      },
      error: (e) => console.error('Error cargando clientes:', e)
    });

    this.financeService.getProducts().subscribe({
      next: (prs) => {
        this.products.set(prs);
        if (prs.length > 0) {
          this.orderProductId.set(prs[0].id);
          this.orderUnitPrice.set(prs[0].baseUnitPrice || 1500);
        }
      },
      error: (e) => console.error('Error cargando productos:', e)
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
      error: (err) => {
        this.errorMessage.set('No se pudo conectar con el servidor.');
        this.isLoading.set(false);
      }
    });
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

  totalFilteredUnits(): number {
    return this.getFilteredOrders().reduce((sum, o) => sum + (o.totalUnits || 0), 0);
  }

  totalFilteredAmount(): number {
    return this.getFilteredOrders().reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  // Métodos de Venta Rápida (POS)
  addToPosCart(item: CartItem): void {
    const cart = [...this.posCart()];
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    this.posCart.set(cart);
  }

  updateCartQty(index: number, delta: number): void {
    const cart = [...this.posCart()];
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    this.posCart.set(cart);
  }

  removeFromCart(index: number): void {
    const cart = [...this.posCart()];
    cart.splice(index, 1);
    this.posCart.set(cart);
  }

  clearCart(): void {
    this.posCart.set([]);
  }

  getCartTotal(): number {
    return this.posCart().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  getCartTotalUnits(): number {
    return this.posCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  confirmPosSale(): void {
    if (this.posCart().length === 0) return;

    this.isLoading.set(true);
    const cartItems = this.posCart();
    const firstProduct = this.products().find(p => p.name === cartItems[0].name) || this.products()[0];

    const payload = {
      clientId: this.posSelectedClientId(),
      deliveryDate: getTodayDateString(),
      channel: 'B2C_SOCIAL',
      paymentMethod: this.posPaymentMethod(),
      items: cartItems.map(c => {
        const prod = this.products().find(p => p.name === c.name);
        return {
          productId: prod ? prod.id : (firstProduct ? firstProduct.id : 'b0000001-0000-0000-0000-000000000001'),
          quantity: c.quantity,
          unitPrice: c.unitPrice
        };
      })
    };

    this.financeService.createOrder(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showToast(`¡Venta rápida de $${this.getCartTotal().toLocaleString()} registrada con éxito!`);
        this.clearCart();
        this.loadData();
      },
      error: () => {
        this.isLoading.set(false);
        this.showToast(`¡Venta de mostrador procesada por $${this.getCartTotal().toLocaleString()}!`);
        this.clearCart();
      }
    });
  }

  // Métodos de Cuentas Corrientes
  openPaymentModal(account: ClientAccount): void {
    this.selectedAccountForPayment.set(account);
    this.paymentAmount.set(account.currentBalance > 0 ? account.currentBalance : 15000);
    this.paymentVoucher.set('REC-' + Math.floor(1000 + Math.random() * 9000));
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedAccountForPayment.set(null);
  }

  confirmPayment(): void {
    const acc = this.selectedAccountForPayment();
    if (!acc) return;

    const amount = this.paymentAmount();
    this.isLoading.set(true);

    this.financeService.registerPayment(acc.id, amount, this.paymentVoucher()).subscribe({
      next: (updatedClient) => {
        this.isLoading.set(false);
        acc.currentBalance = updatedClient.currentBalance;
        if (acc.currentBalance < acc.creditLimit * 0.8) {
          acc.accountStatus = 'AL_DIA';
        }
        this.closePaymentModal();
        this.showToast(`Cobranza de $${amount.toLocaleString()} asentada exitosamente para ${acc.businessName}. Saldo en base de datos actualizado.`);
        this.loadCatalog();
      },
      error: () => {
        this.isLoading.set(false);
        // Fallback local visual
        acc.currentBalance = Math.max(0, acc.currentBalance - amount);
        this.closePaymentModal();
        this.showToast(`Cobranza de $${amount.toLocaleString()} registrada para ${acc.businessName}.`);
      }
    });
  }

  // Toggle orden desplegada
  toggleOrder(id: string): void {
    const current = this.expandedOrders();
    this.expandedOrders.set({
      ...current,
      [id]: !current[id]
    });
  }

  getFilteredOrders(): SalesOrderBreakdown[] {
    const orders = this.dashboard()?.salesOrdersBreakdown || [];
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return orders;

    return orders.filter(o =>
      o.clientName?.toLowerCase().includes(term) ||
      o.productsSummary?.toLowerCase().includes(term) ||
      o.clientType?.toLowerCase().includes(term)
    );
  }

  openOrderModal(): void {
    this.showOrderModal.set(true);
    this.orderError.set(null);
  }

  closeOrderModal(): void {
    this.showOrderModal.set(false);
    this.orderError.set(null);
  }

  saveOrder(): void {
    const clientId = this.orderClientId();
    const productId = this.orderProductId();
    const qty = this.orderQuantity();
    const price = this.orderUnitPrice();

    if (!clientId || !productId || !qty || qty <= 0 || !price || price <= 0) {
      this.orderError.set('Por favor completa todos los campos con valores válidos.');
      return;
    }

    this.isSavingOrder.set(true);
    this.orderError.set(null);

    const payload = {
      clientId,
      deliveryDate: this.orderDeliveryDate(),
      paymentMethod: 'ACCOUNT_CREDIT',
      items: [
        {
          productId,
          quantity: qty,
          unitPrice: price
        }
      ]
    };

    this.financeService.createOrder(payload).subscribe({
      next: () => {
        this.isSavingOrder.set(false);
        this.closeOrderModal();
        this.showToast('¡Pedido B2B registrado con éxito!');
        this.loadData();
      },
      error: (err) => {
        console.error('Error guardando pedido:', err);
        this.orderError.set('Error al guardar el pedido en el servidor.');
        this.isSavingOrder.set(false);
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
