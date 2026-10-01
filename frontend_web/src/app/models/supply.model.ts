export interface RawMaterialStock {
  id: string;
  code: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  lastPurchasePrice: number;
  totalValue: number;
  stockStatus: 'CRITICO' | 'ADVERTENCIA' | 'OPTIMO';
  suggestedReorderQty: number;
  isActive?: boolean;
}

export interface Supplier {
  id: string;
  businessName: string;
  taxId?: string;
  contactPhone?: string;
  email?: string;
  isActive: boolean;
}

export interface PurchaseItem {
  id?: string;
  rawMaterialId: string;
  rawMaterialCode?: string;
  rawMaterialName?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface PurchaseInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID';
  items: PurchaseItem[];
}

export interface RegisterPurchasePayload {
  supplierId: string;
  invoiceNumber?: string;
  invoiceDate: string;
  paymentStatus: string;
  items: {
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface MaterialPlanningItem {
  rawMaterialCode: string;
  rawMaterialName: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStock: number;
  requiredForPendingOrders: number;
  suggestedPurchaseQty: number;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  urgency: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface SupplyPlanning {
  totalEstimatedPurchasesCost: number;
  totalMaterialsAlert: number;
  planningItems: MaterialPlanningItem[];
}
