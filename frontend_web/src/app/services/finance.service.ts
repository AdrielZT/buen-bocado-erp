import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinanceDashboard, OperatingExpense, ClientOption, ProductOption } from '../models/finance.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:8080/api/v1/finance'
    : '/api/v1/finance';

  getDashboard(startDate: string, endDate: string): Observable<FinanceDashboard> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<FinanceDashboard>(`${this.apiUrl}/dashboard`, { params });
  }

  downloadExcel(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  getClients(): Observable<ClientOption[]> {
    return this.http.get<ClientOption[]>(`${this.apiUrl}/clients`);
  }

  createClient(clientData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients`, clientData);
  }

  registerPayment(clientId: string, amount: number, voucherNumber?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients/${clientId}/payments`, { amount, voucherNumber });
  }

  getProducts(): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${this.apiUrl}/products`);
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, orderData);
  }

  createReturn(returnData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/returns`, returnData);
  }

  deleteReturn(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/returns/${id}`);
  }

  getExpenses(startDate?: string, endDate?: string): Observable<OperatingExpense[]> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }
    return this.http.get<OperatingExpense[]>(`${this.apiUrl}/expenses`, { params });
  }

  createExpense(expense: Partial<OperatingExpense>): Observable<OperatingExpense> {
    return this.http.post<OperatingExpense>(`${this.apiUrl}/expenses`, expense);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/expenses/${id}`);
  }

  deleteExpensesBatch(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/expenses/batch-delete`, ids);
  }

  updateClient(id: string, clientData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/clients/${id}`, clientData);
  }

  toggleClientStatus(id: string, isActive?: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/clients/${id}/status`, { isActive });
  }

  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, productData);
  }

  toggleProductStatus(id: string, isActive?: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/products/${id}/status`, { isActive });
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/orders/${id}`);
  }
}
