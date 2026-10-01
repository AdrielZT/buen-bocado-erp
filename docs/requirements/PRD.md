# Documento de Requerimientos del Producto (PRD)
## Proyecto: Buen Bocado ERP

---

## 1. Visión y Objetivos del Negocio

### 1.1 Visión General
**Buen Bocado** es una fábrica y distribuidora de sándwiches frescos artesanales (pebetes, triples de miga, sándwiches de milanesa y nuevos sabores experimentales). Su propuesta de valor se basa en la **máxima frescura** (consumo ideal dentro de las 12 a 24 horas posteriores a la elaboración).

El sistema **Buen Bocado ERP** es una plataforma unificada y multiplataforma (Cloud, Escritorio, Móvil iOS/Android) con capacidad **Offline-First**. Su objetivo principal es resolver la descoordinación operativa, eliminar la dependencia de planillas de cálculo y unificar en tiempo real (o eventual sincro) la toma de pedidos, planificación JIT de compras/cocina, logística de entrega, cuentas corrientes y analítica económico-financiera avanzada (EBITDA, NOF, punto de equilibrio ponderado, márgenes y mermas).

### 1.2 Objetivos de Negocio (KPIs y Metas)
- **Cero Quiebres de Frescura / Minimización de Devoluciones:** Reducir la tasa de devoluciones y mermas de sándwiches por debajo del 3% mediante planificación sincronizada de compras y producción.
- **Producción Just-in-Time (JIT):** Planificar las compras matutinas en función de la demanda confirmada por preventistas para la tarde, y programar la elaboración pocas horas antes de los despachos de pedidos programados (redes sociales / docenas).
- **Eficiencia en Preventa y Reparto:** Reducir los tiempos de toma de pedidos en calle y mostrador, optimizando las rutas de entrega mediante georreferenciación (Google Maps).
- **Control de Cuentas Corrientes y Cobranzas:** Visibilidad en tiempo real de saldos adeudados por kioscos, despensas y cafeterías.
- **Visibilidad Financiera Automática:** Automatizar la generación de Estados de Resultados, cálculo de Costo de Mercaderías Vendidas (CMV) por lote, EBITDA, NOF, Capital de Trabajo y Punto de Equilibrio Ponderado.

---

## 2. Arquitectura de Sistemas y Clientes

### 2.1 Topología
- **Backend Central Cloud:** API REST centralizada construida en **Java 21 LTS con Spring Boot 3**, base de datos relacional **PostgreSQL 16 + PostGIS** para consistencia contable/stock y servicio de sincronización delta con Outbox Pattern.
- **Frontend Web Administrativo:** Aplicación web rica en **Angular 17+ (TypeScript)** para backoffice analítico, contabilidad, finanzas y auditoría.
- **Clientes Operativos y de Campo (Offline-First):** Aplicaciones en **Flutter 3.x (Dart)** para Android, iOS y Windows Desktop, con base de datos local embebida **SQLite (Drift ORM + SQLCipher)** con motor de sincronización bidireccional resiliente a cortes de conectividad.

### 2.2 Aplicaciones por Rol y Stack Asignado
| Dispositivo / App | Stack Tecnológico | Roles Principales | Funciones Clave |
| :--- | :--- | :--- | :--- |
| **Backoffice Web Admin** | **Angular 17+** (Web Cloud) | Administrador Contable, Encargado Informático | Finanzas completas, Estados de Resultados, KPIs (EBITDA, NOF), fijación de precios, liquidación de comisiones, auditoría, exportación Excel con Apache POI. |
| **App Móvil de Preventa** | **Flutter 3.x** (Android / iOS Nativo) | Preventista de Calle, Preventista de Redes | Catálogo con listas de precios dinámicas, toma de pedidos offline (SQLite), alta de clientes con geolocalización Google Maps, cobranzas/recibos, registro de devoluciones, cálculo de comisiones. |
| **Terminal de Cocina / Planta** | **Flutter 3.x** (Windows Desktop / Tablet) | Operarios de Cocina, Jefe de Producción | Órdenes de producción JIT, consumo de insumos por receta/lote, registro de lotes elaborados, ajuste de mermas y rendimientos. |
| **Punto de Venta Mostrador (POS)** | **Flutter 3.x** (Windows Desktop) | Cajero de Fábrica / Mostrador | Venta directa por unidad / docena, facturación rápida, cobro efectivo/transferencia/tarjeta, arqueo y cierre de caja diario, impresión directa ESC/POS. |

---

## 3. Roles de Usuario (User Personas)

1. **Encargado Informático (Super Admin):**
   - Acceso irrestricto a todas las pantallas, configuraciones de sincronización, logs de auditoría, gestión de usuarios y parámetros globales.
2. **Administrador Contable:**
   - Supervisa gastos fijos y variables, compras, conciliación de cuentas corrientes, estados de resultados, KPIs financieros (EBITDA, NOF, punto de equilibrio), liquidación de comisiones a preventistas y exportación de datos a Excel.
3. **Preventista de Calle (B2B):**
   - Visita kioscos, despensas y cafeterías. Carga pedidos en ruta sin internet, visualiza el saldo de cuenta corriente del negocio, registra devoluciones de productos vencidos/dañados y consulta la ruta sugerida de entrega.
4. **Preventista de Redes Sociales (B2C Encargos):**
   - Atiende clientes particulares. Vende docenas y medias docenas pactando fecha, franja horaria y dirección de entrega. Cobra comisiones por ventas concretadas.
5. **Cajero de Local / Fábrica:**
   - Realiza ventas al paso de unidades y docenas, gestiona cobros rápidos en mostrador, emite tickets y realiza el cierre de caja.
6. **Operario de Cocina:**
   - Visualiza la lista de producción consolidada (tarde para B2B del día siguiente, JIT para encargos de redes). Declara los insumos utilizados, lotes producidos y sobrantes/desperdicios.

---

## 4. Módulos del Sistema y Requerimientos Funcionales (INVEST & Given-When-Then)

### Módulo 1: Catálogo, Precios Flexibles y Clientes B2B/B2C

#### US-01: Listas de Precios Diferenciadas por Cliente y Volumen
> **Como** Administrador Contable  
> **Quiero** definir esquemas de precios según tipo de cliente, negocio particular o volumen de compra  
> **Para** que cada canal y cliente facture automáticamente la tarifa acordada sin errores manuales.

- **Criterio de Aceptación 1 (Given-When-Then):**
  - **Given** que el cliente "Kiosco Central" tiene una lista de precio acordada de \$1.200 por pebete de JyQ,
  - **When** el preventista crea un pedido para "Kiosco Central" y selecciona dicho producto,
  - **Then** el sistema asigna automáticamente \$1.200 por unidad.
- **Criterio de Aceptación 2:**
  - **Given** una regla de precio promocional por volumen (ej. docena o media docena),
  - **When** la cantidad seleccionada alcanza o supera el umbral de escala,
  - **Then** el precio unitario se ajusta según el descuento por volumen configurado.

#### US-02: Registro de Clientes con Geolocalización
> **Como** Preventista de Calle o Redes  
> **Quiero** dar de alta clientes con nombre, contacto, CUIT/DNI, condición fiscal y ubicación exacta en Google Maps  
> **Para** facilitar la entrega y optimizar los repartos matutinos.

- **Criterio de Aceptación:**
  - **Given** un nuevo negocio visitado sin conexión a internet,
  - **When** el preventista ingresa los datos y captura las coordenadas GPS / punto de mapa,
  - **Then** el cliente se guarda localmente en el dispositivo y se sincroniza al recuperar conectividad.

---

### Módulo 2: Preventa, Cuentas Corrientes y Devoluciones

#### US-03: Toma de Pedidos B2B y Encargos Programados Offline
> **Como** Preventista  
> **Quiero** confeccionar pedidos seleccionando cliente, ítems, fecha/hora estimada de entrega y método de pago previsto  
> **Para** comprometer pedidos con los clientes incluso en zonas sin cobertura de red.

- **Criterio de Aceptación 1:**
  - **Given** un pedido de redes sociales por 2 docenas de triples,
  - **When** el preventista especifica entrega para el día siguiente a las 18:00 hs,
  - **Then** el pedido queda marcado como "Encargo B2C Programado" y se transfiere a la cola de producción JIT de la tarde correspondiente.
- **Criterio de Aceptación 2:**
  - **Given** la app móvil sin conexión,
  - **When** se confirma un pedido,
  - **Then** se almacena localmente con UUID único y queda en cola de sincronización.

#### US-04: Gestión de Cuenta Corriente B2B y Cobranzas
> **Como** Preventista de Calle y Administrador Contable  
> **Quiero** consultar el saldo adeudado del cliente, registrar cobros parciales o totales y aplicar límites de crédito  
> **Para** evitar entregas a clientes morosos y mantener la cartera al día.

- **Criterio de Aceptación:**
  - **Given** un cliente con saldo deudor de \$25.000,
  - **When** el preventista cobra \$15.000 en efectivo durante la visita y registra el recibo,
  - **Then** el saldo deudor se actualiza inmediatamente a \$10.000 y se genera el movimiento contable correspondiente.

#### US-05: Registro de Devoluciones y Mermas por Negocio
> **Como** Preventista de Calle  
> **Quiero** registrar la devolución de sándwiches no vendidos o vencidos indicando cantidad, motivo y negocio  
> **Para** ajustar la cuenta corriente (nota de crédito/descuento) y calcular la tasa de devolución por cliente y producto.

- **Criterio de Aceptación:**
  - **Given** que un kiosco devuelve 4 pebetes vencidos,
  - **When** el preventista registra la devolución asociada al cliente y producto,
  - **Then** se genera un crédito en la cuenta corriente del cliente, se registra la pérdida en el inventario como desecho/merma (no vuelve al stock apto) y se alimenta la métrica de tasa de devolución.

---

### Módulo 3: Logística y Ruteo de Repartos

#### US-06: Hoja de Ruta y Optimización de Entregas
> **Como** Encargado de Logística / Repartidor  
> **Quiero** obtener una lista agrupada de pedidos del turno matutino ordenada geográficamente  
> **Para** minimizar el tiempo de viaje y asegurar que los sándwiches lleguen frescos antes de la apertura de los comercios.

- **Criterio de Aceptación:**
  - **Given** los pedidos confirmados para reparto entre las 06:00 y las 10:00 AM,
  - **When** se genera la hoja de ruta,
  - **Then** el sistema presenta los puntos de entrega integrados con enlace directo a navegación en Google Maps y secuencia recomendada.

---

### Módulo 4: Compras, Inventario de Insumos y Control de Producción JIT

#### US-07: Planificación de Compras e Insumos según Demanda
> **Como** Encargado de Producción / Compras  
> **Quiero** que el sistema calcule los requerimientos netos de insumos (pan de miga, pebetes, fiambre, queso, mayonesa, packaging) según los pedidos consolidados  
> **Para** realizar las compras por la mañana evitando faltantes o sobrestock perecedero.

- **Criterio de Aceptación:**
  - **Given** una demanda consolidada de 300 pebetes y 400 triples de miga para la tarde,
  - **When** se consulta el asistente de compras matutino,
  - **Then** el sistema descuenta el stock actual en cámara de frío y genera la lista exacta de compra por ingrediente (kg de queso, kg de jamón, unidades de pan, aderezos).

#### US-08: Gestión de Recetas (BOM) y Lotes de Producción con Costo Variable
> **Como** Operario de Cocina / Administrador  
> **Quiero** dar inicio a una orden de fabricación descontando insumos por receta y registrando el número de lote resultante  
> **Para** conocer el rendimiento real y calcular el Costo de Mercadería Vendida (CMV) específico de cada lote según los precios de compra vigentes.

- **Criterio de Aceptación:**
  - **Given** que el precio del queso subió un 15% en la compra de la mañana,
  - **When** se cierra el lote de producción #L-202609-01,
  - **Then** el costo unitario del sándwich de ese lote refleja el incremento exacto del insumo y el rendimiento obtenido.

---

### Módulo 5: Punto de Venta Mostrador (POS Fábrica)

#### US-09: Venta Rápida Directa en Fábrica
> **Como** Cajero de Mostrador  
> **Quiero** registrar ventas directas de sándwiches individuales o packs de docenas en segundos, emitiendo comprobante  
> **Para** atender a los clientes que compran en el local físico y mantener el stock sincronizado.

- **Criterio de Aceptación:**
  - **Given** un cliente en mostrador que solicita 1 sándwich de milanesa y 1 gaseosa,
  - **When** el cajero cobra y confirma la transacción,
  - **Then** se descuenta la unidad del stock de mostrador, se suma al total de caja diaria y se emite ticket de venta.

---

### Módulo 6: Gastos Operativos, Comisiones y Finanzas

#### US-10: Registro Categorizado de Gastos Operativos
> **Como** Administrador Contable  
> **Quiero** asentar gastos fijos y variables clasificados por tipo (alquiler, sueldos, energía eléctrica, gas, logística, mantenimiento, packaging)  
> **Para** incorporarlos en el cálculo de costos indirectos y punto de equilibrio.

- **Criterio de Aceptación:**
  - **Given** la factura de luz del mes por \$120.000,
  - **When** se registra como gasto operativo en la categoría "Servicios",
  - **Then** impacta en los egresos del período contable para el cálculo del EBIT/EBITDA.

#### US-11: Liquidación de Comisiones de Preventistas
> **Como** Administrador Contable  
> **Quiero** configurar y liquidar comisiones porcentuales o fijas sobre ventas cobradas para preventistas de redes (y preventistas de calle)  
> **Para** automatizar el cálculo de retribuciones mensuales según el rendimiento de cada vendedor.

- **Criterio de Aceptación:**
  - **Given** un preventista de redes con una comisión pactada del 8% sobre ventas efectivas,
  - **When** se ejecuta la liquidación del período con ventas validadas por \$500.000,
  - **Then** el sistema calcula una comisión a liquidar de \$40.000 y emite el detalle desglosado por pedido.

---

### Módulo 7: Business Intelligence, Tableros, Reportes y KPIs Financieros

#### US-12: Cálculo de Métricas e Indicadores Financieros
> **Como** Administrador Contable y Dueño  
> **Quiero** un panel analítico que calcule en tiempo real los indicadores financieros clave:
> - **EBITDA y EBIT**
> - **NOF (Necesidades Operativas de Fondos) y Capital de Trabajo**
> - **Punto de Equilibrio Ponderado** (en unidades y monto monetario)
> - **Margen de Contribución** (por producto y global)
> - **Rentabilidad Neta y Margen Bruto**
> - **Ticket Promedio**
> - **Tasa y Monto de Pérdidas por Devolución** (por negocio y por producto)  
> **Para** tomar decisiones estratégicas de precios, compras y surtido comercial.

#### US-13: Estado de Resultados Parametrizable
> **Como** Administrador Contable  
> **Quiero** emitir el Estado de Resultados estructurado (Ventas Netas - CMV = Utilidad Bruta - Gastos Operativos = EBITDA - Depreciaciones = EBIT - Financieros/Impuestos = Utilidad Neta) con filtros por rangos de fechas personalizados  
> **Para** conocer la salud económica exacta del negocio en cualquier intervalo de tiempo.

#### US-14: Cuadros Desagregados con Porcentajes y Gráficos Comparativos
> **Como** Administrador Contable  
> **Quiero** visualizar:
> 1. Cuadro de ventas por negocio: Monto total facturado y columna con el **% sobre el total general**.
> 2. Cuadro de compras por insumo: Monto total gastado en el mes y columna con el **% de incidencia**.
> 3. Gráficos de columnas interactivos de ventas por cliente/negocio.
> 4. Gráficos de columnas de ventas por producto.
> 5. Gráfico de evolución temporal de ventas por fecha seleccionada.
> 6. Exportación completa de todas las tablas y datos subyacentes a planillas Excel (.xlsx).

---

## 5. Reglas de Negocio y Restricciones Técnicas

### 5.1 Reglas de Negocio (RN)
1. **RN-01 (Frescura y Ciclo JIT):** La producción para entrega B2B matutina debe elaborarse en el turno tarde previo. Los pedidos B2C de redes deben agendarse con franja horaria para habilitar producción JIT (máximo 4 a 6 horas antes de la entrega cuando sea factible).
2. **RN-02 (Tratamiento de Devoluciones):** Los sándwiches devueltos por vencimiento o deterioro bajo ninguna circunstancia reingresan al stock vendible; se asientan directamente en la cuenta de "Pérdida por Devolución" imputada al cliente y producto correspondiente.
3. **RN-03 (Trazabilidad y Costeo por Lote):** Cada partida de elaboración genera un código de lote vinculado a los lotes de insumos consumidos. El CMV se calculará priorizando el método PEPS (Primeras Entradas, Primeras Salidas) o costo real de compra del lote.
4. **RN-04 (Políticas de Cuentas Corrientes):** Ningún cliente puede superar el límite de crédito configurado sin autorización expresa del Administrador Contable.
5. **RN-05 (Comisiones sobre Cobranza):** Las comisiones de preventa se liquidan preferentemente sobre pedidos efectivamente entregados y/o cobrados, según configuración de política comercial.

### 5.2 Restricciones Técnicas y No Funcionales (NFR)
1. **NFR-01 (Offline-First):** Las aplicaciones móviles (iOS/Android) y la app de escritorio deben permitir crear pedidos, registrar cobros y consultar inventarios locales sin acceso a internet, sincronizándose de forma transparente al detectar conectividad.
2. **NFR-02 (Resolución de Conflictos de Sincronización):** En caso de conflicto de datos durante la sincronización, prevalece la política de auditoría con marca de tiempo UTC (*last-write-wins* para datos informativos, y conciliación acumulativa para movimientos de stock y caja).
3. **NFR-03 (Seguridad y Permisos RBAC):** Control de acceso granular basado en roles. Solo el Encargado Informático y el Administrador Contable pueden acceder a métricas financieras confidenciales (EBITDA, NOF, sueldos).
4. **NFR-04 (Exportabilidad):** Todas las grillas analíticas y de reportes deben poseer funcionalidad nativa de exportación a formato Microsoft Excel (.xlsx) y PDF.

---

## 6. Arquitectura de Información y Roadmap de Vistas (Vínculo Normativo)

Para el detalle exhaustivo del mapa de navegación (Sitemap), la jerarquía visual de cada pantalla y la priorización estricta de alcance (**AHORA - MVP Operativo** vs. **FUTURO - Fase 2 / Escalamiento**), consultar el documento oficial:
- [Arquitectura de Información y Roadmap de Vistas](INFORMATION_ARCHITECTURE_AND_ROADMAP.md)

---

## 7. Actualización del Modelo Operativo: Modelo Híbrido MTS/MTO, Caducidad 5 Días y Catálogo Extendido

A partir de la auditoría y debate con la Dirección General (29 de Septiembre de 2026), se establecen formalmente las siguientes reglas de negocio que actualizan y amplían las secciones previas:

1. **RN-06 (Modelo Híbrido Make-to-Order + Make-to-Stock):**
   - **Canal B2B (Kioscos y Cafeterías):** Producción programada **MTO** con pedido previo de 12 a 24 horas y despacho matutino (05:00 a 11:00 AM).
   - **Canal B2C (Redes y Mostrador):** Producción para inventario **MTS** para venta y despacho inmediato (cierre de marketing instantáneo).
2. **RN-07 (Vida Útil Extendida a 5 Días en Frío):**
   - Los sándwiches y productos frescos conservados entre 2°C y 6°C poseen una vida útil de **hasta 5 días (120 horas)**.
   - **Semáforo PEPS por Lote:**
     - **Verde (Días 1 y 2):** Frescura óptima para despacho regular.
     - **Amarillo (Días 3 y 4):** Alerta de rotación activa; sugerencia de ofertas relámpago en mostrador y redes.
     - **Rojo (Día 5):** Bloqueo automático para venta. Pasa a descarte/merma por vencimiento.
3. **RN-08 (Catálogo Dinámico Multi-Categoría y Combos):**
   - **Elaborados Propios:** Sándwiches, pizzas frías listas para hornear, helados, jugos naturales y postres (cada uno con su Receta BOM y vida útil específica).
   - **Mercadería de Reventa:** Gaseosas, aguas, snacks y golosinas (ingresan por compra y se venden con margen directo sin receta).
   - **Combos y Packs:** Venta unificada con explosión dinámica de inventario en tiempo real (descuenta elaborados y mercadería de reventa simultáneamente).

Para consultar la bitácora completa de entrevistas y decisiones, ver:
- [Registro de Auditoría y Control de Cambios](AUDIT_AND_CHANGE_MANAGEMENT.md)


