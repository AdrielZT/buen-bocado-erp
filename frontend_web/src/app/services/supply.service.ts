import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RawMaterialStock,
  Supplier,
  PurchaseInvoice,
  RegisterPurchasePayload,
  SupplyPlanning
} from '../models/supply.model';

@Injectable({
  providedIn: 'root'
})
export class SupplyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:8080/api/v1/supplies'
    : '/api/v1/supplies';

  getRawMaterials(): Observable<RawMaterialStock[]> {
    return this.http.get<RawMaterialStock[]>(`${this.apiUrl}/materials`);
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers`);
  }

  createSupplier(supplier: { businessName: string; taxId?: string; contactPhone?: string; email?: string }): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, supplier);
  }

  getPurchases(startDate?: string, endDate?: string): Observable<PurchaseInvoice[]> {
    let url = `${this.apiUrl}/purchases`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<PurchaseInvoice[]>(url);
  }

  registerPurchase(payload: RegisterPurchasePayload): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(`${this.apiUrl}/purchases`, payload);
  }

  getSupplyPlanning(): Observable<SupplyPlanning> {
    return this.http.get<SupplyPlanning>(`${this.apiUrl}/planning`);
  }

  updateMaterial(id: string, payload: { stock?: number; price?: number; minimumStock?: number }): Observable<RawMaterialStock> {
    return this.http.put<RawMaterialStock>(`${this.apiUrl}/materials/${id}`, payload);
  }

  createMaterial(payload: { code?: string; name: string; category?: string; unitOfMeasure?: string; currentStock?: number; minimumStock?: number; lastPurchasePrice?: number }): Observable<RawMaterialStock> {
    return this.http.post<RawMaterialStock>(`${this.apiUrl}/materials`, payload);
  }

  toggleMaterialStatus(id: string, isActive?: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/materials/${id}/status`, { isActive });
  }

  updateSupplier(id: string, supplier: { businessName?: string; taxId?: string; contactPhone?: string; email?: string }): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/suppliers/${id}`, supplier);
  }

  toggleSupplierStatus(id: string, isActive?: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/suppliers/${id}/status`, { isActive });
  }

  deletePurchase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/purchases/${id}`);
  }
}
