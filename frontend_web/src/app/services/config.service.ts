import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto, PlantPolicyDto, AuditLogDto, SystemHealthDto } from '../models/config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);
  private apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:8080/api/v1/config'
    : '/api/v1/config';

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users`);
  }

  createUser(user: Partial<UserDto>): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/users`, user);
  }

  getPolicies(): Observable<PlantPolicyDto> {
    return this.http.get<PlantPolicyDto>(`${this.apiUrl}/policies`);
  }

  updatePolicies(policy: PlantPolicyDto): Observable<PlantPolicyDto> {
    return this.http.put<PlantPolicyDto>(`${this.apiUrl}/policies`, policy);
  }

  getAuditLogs(): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.apiUrl}/audit-logs`);
  }

  getSystemHealth(): Observable<SystemHealthDto> {
    return this.http.get<SystemHealthDto>(`${this.apiUrl}/system-health`);
  }
}
