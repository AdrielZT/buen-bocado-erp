export interface SalesOrderItemDetail {
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  percentOfOrder: number;
}

export interface SalesOrderBreakdown {
  orderId: string;
  orderDate: string;
  clientName: string;
  clientType: string;
  totalAmount: number;
  percentOfSales: number;
  productsSummary: string;
  totalUnits: number;
  items?: SalesOrderItemDetail[];
}

export interface MaterialCmvBreakdown {
  materialId?: string;
  code: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  quantityConsumed: number;
  totalCost: number;
  percentOfCmv: number;
  percentOfSales: number;
}

export interface OperatingExpenseBreakdown {
  id: string;
  expenseDate: string;
  category: string;
  concept: string;
  voucherNumber?: string;
  amount: number;
  isFixedCost: boolean;
  percentOfExpenses: number;
  percentOfSales: number;
}

export interface ReturnItem {
  id: string;
  returnDate: string;
  clientName: string;
  productName: string;
  quantity: number;
  creditedAmount: number;
  lossAmount: number;
  reason: string;
}

export interface BreakEvenProductUnit {
  productId: string;
  productName: string;
  category: string;
  averagePrice: number;
  volumeSharePercent: number;
  requiredUnits: number;
  requiredSalesAmount: number;
}

export interface FinanceDashboard {
  startDate: string;
  endDate: string;
  grossSales: number;
  totalReturnsAmount: number;
  totalReturnsUnits: number;
  returnRatePercent: number;
  totalSales: number;
  totalCmv: number;
  grossProfit: number;
  grossMarginPercent: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalOperatingExpenses: number;
  rawMaterialPurchasesTotal?: number;
  inventoryVariationAmount?: number;
  cashSurplus?: number;
  operatingProfit?: number;
  operatingMarginPercent?: number;
  ebitda: number;
  ebit: number;
  netProfit: number;
  netMarginPercent?: number;
  nof: number;
  workingCapital: number;
  weightedBreakEvenUnits?: number;
  weightedBreakEvenAmount: number;
  averageTicket: number;
  salesOrdersBreakdown?: SalesOrderBreakdown[];
  rawMaterialCmvBreakdown?: MaterialCmvBreakdown[];
  operatingExpensesBreakdown?: OperatingExpenseBreakdown[];
  returnsBreakdown?: ReturnItem[];
  breakEvenProductBreakdown?: BreakEvenProductUnit[];
}

export interface ClientOption {
  id: string;
  businessName: string;
  clientType: string;
  taxId?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  deliveryAddress?: string;
  creditLimit?: number;
  currentBalance?: number;
  isActive?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  sku?: string;
  category: string;
  baseUnitPrice: number;
  shelfLifeHours?: number;
  isActive?: boolean;
}

export interface OperatingExpense {
  id?: string;
  expenseDate: string;
  category: string;
  concept: string;
  amount: number;
  isFixedCost: boolean;
  voucherNumber?: string;
  voucherUrl?: string;
  createdAt?: string;
}

export type ScorecardPerspective = 'FINANCIAL' | 'PROCESSES' | 'CLIENTS';

export interface ScorecardIndicator {
  id: string;
  perspective: ScorecardPerspective;
  name: string;
  explanation: string;
  formula: string;
  currentValue: string;
  targetGoal: string;
  isCustom?: boolean;
}
