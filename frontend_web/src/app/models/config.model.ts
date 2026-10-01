export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlantPolicyDto {
  plantName: string;
  plantAddress: string;
  maxFreshnessHours: number;
  defaultCreditLimit: number;
  maxWasteTolerancePercent: number;
  orderCutoffTime: string;
  alertOnNegativeEbitda: boolean;
  standardShelfLifeDays: number;
}

export interface AuditLogDto {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  module: string;
  entity: string;
  details: string;
  ipAddress: string;
  status: string;
}

export interface SystemHealthDto {
  springBootStatus: string;
  postgresStatus: string;
  redisStatus: string;
  pendingSyncMutations: number;
  uptimeSeconds: number;
  activeProfile: string;
  dbVersion: string;
  serviceDetails: { [key: string]: string };
}
