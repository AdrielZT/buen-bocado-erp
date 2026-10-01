import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { FinanceDashboard, OperatingExpense } from '../../models/finance.model';
import { getTodayDateString, getCurrentMonthStart, getCurrentMonthEnd } from '../../utils/date-utils';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.scss']
})
export class FinanceDashboardComponent implements OnInit {
  private readonly financeService = inject(FinanceService);

  // Inicializado dinámicamente con la fecha actual del día de acceso
  startDate = signal<string>(getCurrentMonthStart());
  endDate = signal<string>(getCurrentMonthEnd());

  dashboard = signal<FinanceDashboard | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Control de secciones desplegables
  expandedSections = signal<Record<string, boolean>>({
    cmv: true,
    expenses: true
  });

  // Modal Registro de Gasto
  showExpenseModal = signal<boolean>(false);
  isSavingExpense = signal<boolean>(false);
  formError = signal<string | null>(null);

  newExpenseDate = signal<string>(getTodayDateString());
  newCategory = signal<string>('PACKAGING');
  newConcept = signal<string>('');
  newAmount = signal<number | null>(null);
  newIsFixedCost = signal<boolean>(false);
  newVoucherNumber = signal<string>('');

  readonly categories = [
    'ALQUILER',
    'SUELDOS',
    'ENERGIA',
    'GAS',
    'COMBUSTIBLE',
    'MANTENIMIENTO',
    'PACKAGING',
    'INSUMOS',
    'OTROS'
  ];

  ngOnInit(): void {
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
        console.error('Error cargando métricas financieras:', err);
        this.errorMessage.set('No se pudo conectar con el servidor Spring Boot (http://localhost:8080).');
        this.isLoading.set(false);
      }
    });
  }

  toggleSection(sectionKey: string): void {
    const current = this.expandedSections();
    this.expandedSections.set({
      ...current,
      [sectionKey]: !current[sectionKey]
    });
  }

  isExpanded(sectionKey: string): boolean {
    return !!this.expandedSections()[sectionKey];
  }

  exportExcel(): void {
    this.financeService.downloadExcel(this.startDate(), this.endDate()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buen_bocado_financiero_${this.startDate()}_${this.endDate()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        alert('Ocurrió un error al descargar el reporte Excel.');
      }
    });
  }

  openExpenseModal(): void {
    this.formError.set(null);
    this.newConcept.set('');
    this.newAmount.set(null);
    this.newVoucherNumber.set('');
    this.showExpenseModal.set(true);
  }

  closeExpenseModal(): void {
    this.showExpenseModal.set(false);
  }

  saveExpense(): void {
    if (!this.newConcept().trim()) {
      this.formError.set('Ingrese el concepto o descripción del gasto.');
      return;
    }
    if (!this.newAmount() || this.newAmount()! <= 0) {
      this.formError.set('Ingrese un monto válido mayor a cero.');
      return;
    }

    this.isSavingExpense.set(true);
    this.formError.set(null);

    const expensePayload: Partial<OperatingExpense> = {
      expenseDate: this.newExpenseDate(),
      category: this.newCategory(),
      concept: this.newConcept().trim(),
      amount: this.newAmount()!,
      isFixedCost: this.newIsFixedCost(),
      voucherNumber: this.newVoucherNumber().trim() || undefined
    };

    this.financeService.createExpense(expensePayload).subscribe({
      next: () => {
        this.isSavingExpense.set(false);
        this.closeExpenseModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al registrar gasto:', err);
        this.formError.set('Error guardando el gasto en el servidor.');
        this.isSavingExpense.set(false);
      }
    });
  }

  deleteExpense(id: string | undefined): void {
    if (!id) return;
    if (!confirm('¿Está seguro de eliminar este gasto operativo? Los indicadores financieros se recalcularán automáticamente.')) {
      return;
    }

    this.financeService.deleteExpense(id).subscribe({
      next: () => this.loadData(),
      error: (err) => alert('No se pudo eliminar el gasto seleccionado.')
    });
  }
}
