# Buen Bocado ERP - Monorepo

Sistema integral de gestión empresarial (ERP) para fábrica y distribución de sándwiches frescos artesanales con demanda Just-in-Time (JIT) y frescura de 12-24 horas.

---

## Estructura del Monorepo

```text
buen-bocado-erp/
├── backend/            # Java 21 LTS + Spring Boot 3.3.4 (REST API, PostgreSQL, Flyway, Apache POI)
├── frontend_web/       # Angular 17+ (Backoffice Administrativo & Contable, Signals, Standalone)
├── frontend_app/       # Flutter 3.x (Clientes Móviles Android/iOS, Preventa Offline-First, POS Mostrador)
├── docs/               # PRD.md (Requerimientos) y ARCHITECTURE.md (Arquitectura Técnica)
└── docker-compose.yml  # Servicios locales de PostgreSQL 16 (PostGIS) y Redis 7
```

---

## Requisitos Previos y Entorno Local

1. **Java:** OpenJDK 21 LTS (o Eclipse Temurin 21)
2. **Node.js:** v18+ o v20+ LTS y npm
3. **Flutter SDK:** 3.24+ con Dart 3.5+
4. **Docker Desktop:** Para levantar base de datos local

---

## Puesta en Marcha Rápida

### 1. Levantar Base de Datos Central (PostgreSQL 16 + Redis)
```bash
docker-compose up -d
```

### 2. Backend (Spring Boot 3)
```bash
cd backend
# Compilar y ejecutar (requiere Java 21)
mvn spring-boot:run
# Swagger UI disponible en: http://localhost:8080/swagger-ui.html
```

### 3. Portal Web Administrativo (Angular 17)
```bash
cd frontend_web
npm start
# Aplicación disponible en: http://localhost:4200
```

### 4. App Móvil y Operativa (Flutter)
```bash
cd frontend_app
flutter pub get
flutter run
```
