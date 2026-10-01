import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';
import { UserDto, PlantPolicyDto, AuditLogDto, SystemHealthDto } from '../../models/config.model';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-config.component.html',
  styleUrls: ['./system-config.component.scss']
})
export class SystemConfigComponent implements OnInit {
  private configService = inject(ConfigService);

  activeTab: 'users' | 'policies' | 'audit' | 'health' = 'users';
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  users: UserDto[] = [];
  policies: PlantPolicyDto = {
    plantName: 'Buen Bocado Planta Central San Martín',
    plantAddress: 'Av. San Martín 820, Salta Capital',
    maxFreshnessHours: 24,
    defaultCreditLimit: 200000,
    maxWasteTolerancePercent: 3.0,
    orderCutoffTime: '18:00',
    alertOnNegativeEbitda: true,
    standardShelfLifeDays: 1
  };
  auditLogs: AuditLogDto[] = [];
  filteredAuditLogs: AuditLogDto[] = [];
  systemHealth: SystemHealthDto | null = null;

  // Filtro de auditoría
  auditSearchTerm = '';
  auditModuleFilter = 'ALL';

  // Modal nuevo usuario
  showUserModal = false;
  newUser: Partial<UserDto> = {
    username: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: 'ROLE_STREET_PREVENTISTA',
    roleName: 'Preventista de Calle'
  };

  roles = [
    { id: 'ROLE_SUPER_ADMIN', name: 'Super Administrador General' },
    { id: 'ROLE_ACCOUNTING_ADMIN', name: 'Administrador Contable' },
    { id: 'ROLE_STREET_PREVENTISTA', name: 'Preventista de Calle' },
    { id: 'ROLE_KITCHEN_OPERATOR', name: 'Operario Cocina & Reparto' },
    { id: 'ROLE_CASHIER', name: 'Cajero de Mostrador' }
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.configService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.loading = false;
      }
    });

    this.configService.getPolicies().subscribe({
      next: (data) => this.policies = data,
      error: (err) => console.error('Error cargando políticas:', err)
    });

    this.configService.getAuditLogs().subscribe({
      next: (data) => {
        this.auditLogs = data;
        this.applyAuditFilters();
      },
      error: (err) => console.error('Error cargando logs:', err)
    });

    this.configService.getSystemHealth().subscribe({
      next: (data) => this.systemHealth = data,
      error: (err) => console.error('Error cargando salud de sistema:', err)
    });
  }

  savePolicies(): void {
    this.loading = true;
    this.configService.updatePolicies(this.policies).subscribe({
      next: (saved) => {
        this.policies = saved;
        this.loading = false;
        this.showToast('✅ Políticas de planta guardadas y aplicadas a los motores JIT.');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Error actualizando políticas de planta.';
        console.error(err);
      }
    });
  }

  openUserModal(): void {
    this.newUser = {
      username: '',
      fullName: '',
      email: '',
      phone: '',
      roleId: 'ROLE_STREET_PREVENTISTA',
      roleName: 'Preventista de Calle'
    };
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
  }

  onRoleChange(roleId: string): void {
    const r = this.roles.find(x => x.id === roleId);
    if (r) {
      this.newUser.roleName = r.name;
    }
  }

  submitUser(): void {
    if (!this.newUser.username || !this.newUser.fullName) {
      alert('Por favor complete Nombre Completo y Nombre de Usuario.');
      return;
    }

    this.loading = true;
    this.configService.createUser(this.newUser).subscribe({
      next: (created) => {
        this.users.unshift(created);
        this.showUserModal = false;
        this.loading = false;
        this.showToast(`✅ Usuario @${created.username} registrado exitosamente con rol ${created.roleName}.`);
      },
      error: (err) => {
        this.loading = false;
        alert('Error al registrar usuario. Verifique duplicados.');
        console.error(err);
      }
    });
  }

  applyAuditFilters(): void {
    const term = this.auditSearchTerm.toLowerCase();
    this.filteredAuditLogs = this.auditLogs.filter(log => {
      const matchTerm = !term ||
        log.details.toLowerCase().includes(term) ||
        log.username.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term);
      const matchModule = this.auditModuleFilter === 'ALL' || log.module === this.auditModuleFilter;
      return matchTerm && matchModule;
    });
  }

  formatUptime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  }

  showToast(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = null, 4000);
  }
}
