import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LogisticsRouteSheet, DeliveryStop } from '../models/logistics.model';

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:8080/api/v1/logistics'
    : '/api/v1/logistics';

  getRouteSheet(startDate: string, endDate: string): Observable<LogisticsRouteSheet> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<LogisticsRouteSheet>(`${this.apiUrl}/routes`, { params });
  }

  updateDeliveryStatus(orderId: string, status: string, notes?: string): Observable<DeliveryStop> {
    return this.http.patch<DeliveryStop>(`${this.apiUrl}/orders/${orderId}/status`, { status, notes });
  }

  confirmDelivery(orderId: string, amount: number, paymentMethod: string, notes?: string): Observable<DeliveryStop> {
    return this.http.post<DeliveryStop>(`${this.apiUrl}/orders/${orderId}/deliver`, { amount, paymentMethod, notes });
  }
}
