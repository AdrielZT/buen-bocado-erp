import { Routes } from '@angular/router';
import { StrategyScorecardComponent } from './components/strategy-scorecard/strategy-scorecard.component';
import { FinanceDashboardComponent } from './components/finance-dashboard/finance-dashboard.component';
import { SalesManagementComponent } from './components/sales-management/sales-management.component';
import { FactoryOperationsComponent } from './components/factory-operations/factory-operations.component';
import { SupplyManagementComponent } from './components/supply-management/supply-management.component';
import { ProductCatalogComponent } from './components/product-catalog/product-catalog.component';
import { LogisticsDispatchComponent } from './components/logistics-dispatch/logistics-dispatch.component';
import { SystemConfigComponent } from './components/system-config/system-config.component';

export const routes: Routes = [
  { path: '', redirectTo: 'estrategia', pathMatch: 'full' },
  { path: 'estrategia', component: StrategyScorecardComponent, title: 'Dirección & CMI - Buen Bocado ERP' },
  { path: 'finanzas', component: FinanceDashboardComponent, title: 'Finanzas & P&L - Buen Bocado ERP' },
  { path: 'ventas', component: SalesManagementComponent, title: 'Ventas & Clientes - Buen Bocado ERP' },
  { path: 'catalogo', component: ProductCatalogComponent, title: 'Catálogo & Inventario - Buen Bocado ERP' },
  { path: 'fabrica', component: FactoryOperationsComponent, title: 'Fábrica & Calidad - Buen Bocado ERP' },
  { path: 'compras', component: SupplyManagementComponent, title: 'Compras & Proveedores - Buen Bocado ERP' },
  { path: 'logistica', component: LogisticsDispatchComponent, title: 'Logística & Reparto - Buen Bocado ERP' },
  { path: 'configuracion', component: SystemConfigComponent, title: 'Configuración & Auditoría - Buen Bocado ERP' },
  { path: '**', redirectTo: 'estrategia' }
];
