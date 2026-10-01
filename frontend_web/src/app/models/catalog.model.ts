export type ProductType = 'MANUFACTURED' | 'RESALE' | 'BUNDLE';

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string; // 'PEBETE', 'TRIPLE_MIGA', 'MILANESA', 'PIZZA_FRIA', 'HELADO', 'BEBIDA', 'SNACK', 'COMBO'
  productType: ProductType;
  baseUnitPrice: number;
  costPrice: number;
  currentStock: number;
  shelfLifeDays: number; // e.g. 5 days for sandwiches, 4 days for pizzas, 30 days for ice cream, 180 for resale
  batchAgeDays?: number; // Days since production for PEPS traffic light
  freshnessStatus?: 'OPTIMA' | 'ROTACION_URGENTE' | 'VENCIDO';
  unitOfMeasure: string;
  isActive: boolean;
  bundleItems?: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
}

export interface ClientAccount {
  id: string;
  businessName: string;
  taxId: string;
  contactName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  creditLimit: number;
  currentBalance: number;
  accountStatus: 'AL_DIA' | 'EN_RIESGO' | 'BLOQUEADO_MOROSO';
  clientType: 'B2B_KIOSK' | 'B2B_CAFE' | 'B2C_SOCIAL' | string;
}

export interface PriceRule {
  id: string;
  clientId?: string;
  clientName: string;
  productId: string;
  productName: string;
  specialPrice: number;
  minVolumeQty: number;
  discountPercent: number;
}
