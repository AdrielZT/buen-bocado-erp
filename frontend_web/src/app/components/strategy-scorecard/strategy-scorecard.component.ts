import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FinanceDashboard, ScorecardIndicator, ScorecardPerspective } from '../../models/finance.model';
import { getCurrentMonthStart, getCurrentMonthEnd } from '../../utils/date-utils';

@Component({
  selector: 'app-strategy-scorecard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './strategy-scorecard.component.html',
  styleUrls: ['./strategy-scorecard.component.scss']
})
export class StrategyScorecardComponent implements OnInit {
  private readonly financeService = inject(FinanceService);

  // Inicializado dinámicamente con el primer y último día del mes actual en que se ingresa
  startDate = signal<string>(getCurrentMonthStart());
  endDate = signal<string>(getCurrentMonthEnd());

  dashboard = signal<FinanceDashboard | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Sub-pestañas canónicas de Dirección & Estrategia
  activeTab = signal<'executive' | 'cmi' | 'targets'>('executive');

  // Simulador de Ganancia Neta Deseada
  desiredProfitTarget = signal<number>(500000);

  // Modal para Añadir Indicador Personalizado
  showAddIndicatorModal = signal<boolean>(false);
  newIndicatorPerspective = signal<ScorecardPerspective>('FINANCIAL');
  newIndicatorName = signal<string>('');
  newIndicatorExplanation = signal<string>('');
  newIndicatorFormula = signal<string>('');
  newIndicatorValue = signal<string>('');
  newIndicatorGoal = signal<string>('');
  indicatorError = signal<string | null>(null);

  customIndicators = signal<ScorecardIndicator[]>([]);

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem('bb_custom_indicators');
      if (saved) {
        this.customIndicators.set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error recuperando indicadores de localStorage', e);
    }
    this.loadData();
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
        console.error('Error cargando métricas:', err);
        this.errorMessage.set('No se pudo conectar con el servidor Spring Boot (http://localhost:8080).');
        this.isLoading.set(false);
      }
    });
  }

  getFinancialIndicators(): ScorecardIndicator[] {
    const d = this.dashboard();
    const sales = d?.totalSales || 3767803;
    const opProfit = d?.operatingProfit ?? d?.ebitda ?? 210041;
    const grossProfit = d?.grossProfit || 1491041;
    const netProfit = d?.netProfit ?? opProfit;
    const beAmount = d?.weightedBreakEvenAmount || 3148792;
    const beUnits = d?.weightedBreakEvenUnits || 1694;

    // Punto D: Balance Patrimonial Real
    const realAssets = 11346220; // $11.346.220 Activo Total (Bienes de uso $10.5M + Corriente)
    const realEquity = 6870220;  // $6.870.220 Patrimonio Neto
    const roa = ((netProfit / realAssets) * 100).toFixed(2) + '%';
    const roe = ((netProfit / realEquity) * 100).toFixed(2) + '%';
    const opMargin = ((opProfit / (sales || 1)) * 100).toFixed(2) + '%';

    const baseList: ScorecardIndicator[] = [
      {
        id: 'fin-roa',
        perspective: 'FINANCIAL',
        name: 'ROA (Rentabilidad s/ Activos)',
        explanation: 'Capacidad de los activos de planta (cámaras de frío, fiambreras, vehículos, stock) para generar ganancias netas.',
        formula: '(Resultado Neto / Activo Total) × 100',
        currentValue: roa,
        targetGoal: 'Superar el 3.5% mensual sobre activos operativos'
      },
      {
        id: 'fin-roe',
        perspective: 'FINANCIAL',
        name: 'ROE (Rentabilidad s/ Patrimonio)',
        explanation: 'Rendimiento del capital propio invertido por los socios en la fábrica de sándwiches.',
        formula: '(Resultado Neto / Patrimonio Neto) × 100',
        currentValue: roe,
        targetGoal: 'Superar el 5.0% mensual sobre capital propio'
      },
      {
        id: 'fin-opmargin',
        perspective: 'FINANCIAL',
        name: 'Margen Operativo',
        explanation: 'Porcentaje de cada peso neto facturado que queda libre tras cubrir insumos y gastos operativos fabriles.',
        formula: '(Resultado Operativo / Ventas Netas) × 100',
        currentValue: opMargin,
        targetGoal: 'Mantener margen operativo positivo por encima de 5.0%'
      },
      {
        id: 'fin-grossprofit',
        perspective: 'FINANCIAL',
        name: 'Utilidad Bruta Fabril',
        explanation: 'Margen de contribución monetario directo generado tras deducir el costo exacto de insumos de receta (BOM).',
        formula: 'Ventas Netas - CMV Insumos PEPS',
        currentValue: `$ ${grossProfit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        targetGoal: 'Optimizar compras por volumen de jamón y queso'
      },
      {
        id: 'fin-netprofit',
        perspective: 'FINANCIAL',
        name: 'Resultado Neto Final',
        explanation: 'Resultado final de las operaciones fabriles tras deducir todos los gastos operativos y cargas de estructura.',
        formula: 'Resultado Operativo - Amortizaciones - Intereses',
        currentValue: `$ ${netProfit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        targetGoal: 'Maximizar el beneficio neto distribuible'
      },
      {
        id: 'fin-breakeven-units',
        perspective: 'FINANCIAL',
        name: 'Punto de Equilibrio (Unidades Físicas)',
        explanation: 'Cantidad mínima física de sándwiches a producir y vender en el mes para absorber costos fijos y semifijos.',
        formula: 'Costos Fijos / Margen de Contribución Unitario Ponderado',
        currentValue: `${beUnits.toLocaleString('es-AR')} u.`,
        targetGoal: 'Alcanzar el umbral antes del día 22 del mes'
      },
      {
        id: 'fin-breakeven-amount',
        perspective: 'FINANCIAL',
        name: 'Punto de Equilibrio (Facturación $)',
        explanation: 'Monto neto mínimo en pesos a facturar para cubrir el 100% de insumos y estructura operativa.',
        formula: 'Costos Fijos / (1 - (Costos Variables / Ventas Netas))',
        currentValue: `$ ${beAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        targetGoal: 'Superar la facturación de cobertura mensual'
      }
    ];

    const custom = this.customIndicators().filter(i => i.perspective === 'FINANCIAL');
    return [...baseList, ...custom];
  }

  getProcessesIndicators(): ScorecardIndicator[] {
    const baseList: ScorecardIndicator[] = [
      {
        id: 'proc-ret-prod',
        perspective: 'PROCESSES',
        name: 'Tasa de Devolución por Producto',
        explanation: 'Porcentaje de unidades devueltas por vencimiento de 24h sobre el total despachado de cada sándwich.',
        formula: '(Unidades Devueltas / Unidades Vendidas) × 100',
        currentValue: 'Pebete J&Q: 0.9% | Triples Miga: 2.1% | Pebete Salame: 0.5%',
        targetGoal: 'Disminuir devoluciones de Triples al < 1.2% ajustando pedidos matutinos'
      },
      {
        id: 'proc-prod-unit',
        perspective: 'PROCESSES',
        name: 'Productividad por Producto',
        explanation: 'Rendimiento de armado y despacho de sándwiches terminados por hora-hombre de operario.',
        formula: 'Unidades Elaboradas / Horas-Hombre Trabajadas',
        currentValue: 'Pebete: 92 u/h-h | Triples: 68 u/h-h',
        targetGoal: 'Aumentar productividad global un 10% con feteado previo estandarizado'
      },
      {
        id: 'proc-efficiency',
        perspective: 'PROCESSES',
        name: 'Eficiencia en Uso de Insumos (BOM vs Real)',
        explanation: 'Cumplimiento del gramaje teórico de receta (BOM) vs consumo real PEPS registrado en depósito.',
        formula: '(Consumo Teórico Receta / Consumo Real de Insumos) × 100',
        currentValue: '95.4% de aprovechamiento',
        targetGoal: 'Disminuir desperdicios de fiambres un 5% (alcanzar 98% de aprovechamiento)'
      },
      {
        id: 'proc-efficacy',
        perspective: 'PROCESSES',
        name: 'Eficacia de Despacho y Calidad',
        explanation: 'Entregas a comercios clientes en tiempo y forma con cadena de frío estricta (sin reclamos).',
        formula: '(Entregas Conformes / Entregas Totales) × 100',
        currentValue: '98.6% de entregas conformes',
        targetGoal: 'Mantener índice de entregas perfectas por encima del 99%'
      }
    ];

    const custom = this.customIndicators().filter(i => i.perspective === 'PROCESSES');
    return [...baseList, ...custom];
  }

  getClientsIndicators(): ScorecardIndicator[] {
    const d = this.dashboard();
    const orders = d?.salesOrdersBreakdown || [];

    const clientMap = new Map<string, { total: number; count: number; products: Map<string, number> }>();
    for (const ord of orders) {
      if (!clientMap.has(ord.clientName)) {
        clientMap.set(ord.clientName, { total: 0, count: 0, products: new Map() });
      }
      const c = clientMap.get(ord.clientName)!;
      c.total += ord.totalAmount;
      c.count += 1;
      if (ord.items) {
        for (const it of ord.items) {
          c.products.set(it.productName, (c.products.get(it.productName) || 0) + it.quantity);
        }
      }
    }

    const ticketsList: string[] = [];
    const topProdList: string[] = [];
    clientMap.forEach((v, k) => {
      const avg = Math.round(v.total / (v.count || 1));
      ticketsList.push(`${k}: $${avg.toLocaleString('es-AR')}`);

      let topP = 'Sándwich Pebete';
      let maxQ = 0;
      let sumQ = 0;
      v.products.forEach((qty, pName) => {
        sumQ += qty;
        if (qty > maxQ) {
          maxQ = qty;
          topP = pName;
        }
      });
      const pct = sumQ > 0 ? Math.round((maxQ / sumQ) * 100) : 0;
      topProdList.push(`${k}: ${topP} (${pct}% volumen)`);
    });

    const ticketVal = ticketsList.length > 0 ? ticketsList.join(' | ') : 'Promedio B2B: $118.400 / pedido';
    const topProdVal = topProdList.length > 0 ? topProdList.join(' | ') : 'Kioscos: Pebetes J&Q (64%) | Estaciones: Triples (52%)';

    const baseList: ScorecardIndicator[] = [
      {
        id: 'cli-ticket-avg',
        perspective: 'CLIENTS',
        name: 'Ticket Promedio por Cliente',
        explanation: 'Facturación media en pesos de cada cliente por cada entrega matutina despachada.',
        formula: 'Facturación Total al Cliente / Cantidad de Pedidos',
        currentValue: ticketVal,
        targetGoal: 'Incrementar ticket medio de clientes clave un 5% mediante acuerdos de reposición'
      },
      {
        id: 'cli-demand-mix',
        perspective: 'CLIENTS',
        name: 'Preferencia y Demanda de Producto por Cliente',
        explanation: 'Sándwich de mayor rotación y porcentaje que representa en el consumo de cada cliente.',
        formula: '(Unidades Sándwich Más Vendido / Total Unidades Cliente) × 100',
        currentValue: topProdVal,
        targetGoal: 'Fomentar la venta de Triples de Miga en clientes con solo demanda de pebetes'
      }
    ];

    const custom = this.customIndicators().filter(i => i.perspective === 'CLIENTS');
    return [...baseList, ...custom];
  }

  openAddIndicatorModal(): void {
    this.indicatorError.set(null);
    this.newIndicatorName.set('');
    this.newIndicatorExplanation.set('');
    this.newIndicatorFormula.set('');
    this.newIndicatorValue.set('');
    this.newIndicatorGoal.set('');
    this.showAddIndicatorModal.set(true);
  }

  closeAddIndicatorModal(): void {
    this.showAddIndicatorModal.set(false);
  }

  saveCustomIndicator(): void {
    if (!this.newIndicatorName().trim()) {
      this.indicatorError.set('Ingrese el nombre del indicador.');
      return;
    }
    if (!this.newIndicatorExplanation().trim()) {
      this.indicatorError.set('Ingrese la explicación de qué mide.');
      return;
    }
    if (!this.newIndicatorFormula().trim()) {
      this.indicatorError.set('Ingrese la fórmula matemática del indicador.');
      return;
    }
    if (!this.newIndicatorValue().trim()) {
      this.indicatorError.set('Ingrese el valor actual del indicador.');
      return;
    }
    if (!this.newIndicatorGoal().trim()) {
      this.indicatorError.set('Ingrese el objetivo o meta de mejora.');
      return;
    }

    const newInd: ScorecardIndicator = {
      id: 'custom-' + Date.now(),
      perspective: this.newIndicatorPerspective(),
      name: this.newIndicatorName().trim(),
      explanation: this.newIndicatorExplanation().trim(),
      formula: this.newIndicatorFormula().trim(),
      currentValue: this.newIndicatorValue().trim(),
      targetGoal: this.newIndicatorGoal().trim(),
      isCustom: true
    };

    const current = this.customIndicators();
    const updated = [...current, newInd];
    this.customIndicators.set(updated);
    try {
      localStorage.setItem('bb_custom_indicators', JSON.stringify(updated));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
    }

    this.closeAddIndicatorModal();
  }

  removeCustomIndicator(id: string): void {
    if (!confirm('¿Desea eliminar este indicador personalizado?')) return;
    const updated = this.customIndicators().filter(i => i.id !== id);
    this.customIndicators.set(updated);
    try {
      localStorage.setItem('bb_custom_indicators', JSON.stringify(updated));
    } catch (e) {
      console.warn('No se pudo actualizar localStorage', e);
    }
  }

  getTotalProducedUnits(): number {
    const d = this.dashboard();
    if (!d || !d.salesOrdersBreakdown || d.salesOrdersBreakdown.length === 0) return 746;
    return d.salesOrdersBreakdown.reduce((acc, o) => acc + (o.totalUnits || 0), 0);
  }

  getSimulatedTotalUnits(): number {
    const d = this.dashboard();
    if (!d) return 0;
    const baseBreakEven = d.weightedBreakEvenUnits || 2138;
    const avgMarginPerUnit = (d.grossProfit || 831580) / Math.max(1, this.getTotalProducedUnits());
    const extraUnitsNeeded = Math.round((this.desiredProfitTarget() || 0) / Math.max(1, avgMarginPerUnit));
    return baseBreakEven + extraUnitsNeeded;
  }

  getSimulatedTotalRevenue(): number {
    const d = this.dashboard();
    if (!d) return 0;
    const fixedExpenses = (d.fixedExpenses || 770000);
    const marginRatio = Math.max(0.1, (d.grossMarginPercent || 58.5) / 100);
    return Math.round((fixedExpenses + (this.desiredProfitTarget() || 0)) / marginRatio);
  }
}
