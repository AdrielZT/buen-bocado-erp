-- ==============================================================================
-- BUEN BOCADO ERP - DEMO SEED DATA / FIXTURES
-- Datos Semilla Reales de Sándwiches, Ventas, Clientes y Gastos
-- Ejecutar en PostgreSQL 16 (buenbocado_db)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. USUARIOS Y ROLES ADICIONALES
-- ------------------------------------------------------------------------------
-- Passwords hasheadas con BCrypt para 'demo1234'
INSERT INTO users (id, username, password_hash, full_name, email, phone, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin', '$2a$10$wN1k6K5v6vV7xQjU/RZZlO4G9Hh1Q4O8r1R2S3T4U5V6W7X8Y9Za.', 'Ing. Adriel Admin', 'admin@buenbocado.com', '261-4567890', true),
('a0000000-0000-0000-0000-000000000002', 'contadora.marta', '$2a$10$wN1k6K5v6vV7xQjU/RZZlO4G9Hh1Q4O8r1R2S3T4U5V6W7X8Y9Za.', 'Lic. Marta Gómez', 'contabilidad@buenbocado.com', '261-4567891', true),
('a0000000-0000-0000-0000-000000000003', 'carlos.calle', '$2a$10$wN1k6K5v6vV7xQjU/RZZlO4G9Hh1Q4O8r1R2S3T4U5V6W7X8Y9Za.', 'Carlos Repartidor B2B', 'carlos.calle@buenbocado.com', '261-5123456', true),
('a0000000-0000-0000-0000-000000000004', 'valeria.redes', '$2a$10$wN1k6K5v6vV7xQjU/RZZlO4G9Hh1Q4O8r1R2S3T4U5V6W7X8Y9Za.', 'Valeria Preventista B2C', 'valeria.redes@buenbocado.com', '261-5987654', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('a0000000-0000-0000-0000-000000000001', 'ROLE_SUPER_ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'ROLE_ACCOUNTING_ADMIN'),
('a0000000-0000-0000-0000-000000000003', 'ROLE_STREET_PREVENTISTA'),
('a0000000-0000-0000-0000-000000000004', 'ROLE_SOCIAL_PREVENTISTA')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. LISTAS DE PRECIOS
-- ------------------------------------------------------------------------------
INSERT INTO price_lists (id, name, description, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'B2B Kioscos y Despensas', 'Precios mayoristas diarios para comercios barriales', true),
('b0000000-0000-0000-0000-000000000002', 'B2B Cafeterías y Bares', 'Precios con surtido selecto para cafeterías céntricas', true),
('b0000000-0000-0000-0000-000000000003', 'B2C Redes y Mostrador', 'Venta minorista por unidad, media docena y docena cerrada', true)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. CLIENTES REALES (B2B Y B2C CON GEOLOCALIZACIÓN)
-- ------------------------------------------------------------------------------
INSERT INTO clients (id, business_name, tax_id, contact_name, phone, email, delivery_address, location, price_list_id, credit_limit, current_balance, client_type, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Kiosco Central Mitre', '30-71123456-8', 'Roberto Fontana', '261-4201122', 'kioscocentral@gmail.com', 'Av. San Martín 1140, Mendoza', ST_SetSRID(ST_MakePoint(-68.8458, -32.8895), 4326), 'b0000000-0000-0000-0000-000000000001', 80000.00, 15000.00, 'B2B_KIOSK', true),
('c0000000-0000-0000-0000-000000000002', 'Cafetería & Bar La Estación', '30-71554321-9', 'Silvia Rossi', '261-4235566', 'laestacioncafe@gmail.com', 'Belgrano y Las Heras, Mendoza', ST_SetSRID(ST_MakePoint(-68.8512, -32.8841), 4326), 'b0000000-0000-0000-0000-000000000002', 120000.00, 24000.00, 'B2B_CAFE', true),
('c0000000-0000-0000-0000-000000000003', 'Despensa y Fiambrería Don Pepe', '20-22345678-4', 'José Perez', '261-4309988', 'donpepe.fiambreria@gmail.com', 'Paso de los Andes 820, Godoy Cruz', ST_SetSRID(ST_MakePoint(-68.8570, -32.9050), 4326), 'b0000000-0000-0000-0000-000000000001', 50000.00, 8500.00, 'B2B_KIOSK', true),
('c0000000-0000-0000-0000-000000000004', 'Eventos Corporativos Sandra', '27-28991122-3', 'Sandra Benitez', '261-5443322', 'sandraeventos@hotmail.com', 'Barrio Bombal, Mendoza', ST_SetSRID(ST_MakePoint(-68.8480, -32.9010), 4326), 'b0000000-0000-0000-0000-000000000003', 150000.00, 0.00, 'B2C_SOCIAL', true),
('c0000000-0000-0000-0000-000000000005', 'Bar & Resto San Martín', '30-68994411-2', 'Martín Morales', '261-4256677', 'resto.sanmartin@gmail.com', 'Sarmiento 250, Mendoza', ST_SetSRID(ST_MakePoint(-68.8420, -32.8910), 4326), 'b0000000-0000-0000-0000-000000000002', 100000.00, 32000.00, 'B2B_CAFE', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. MATERIAS PRIMAS (INSUMOS PEPS)
-- ------------------------------------------------------------------------------
INSERT INTO raw_materials (id, code, name, category, unit_of_measure, current_stock, minimum_stock, last_purchase_price, is_active) VALUES
('d0000000-0000-0000-0000-000000000001', 'INS-PAN-PEB', 'Pan Pebete Artesanal (bolsa x10)', 'PAN', 'UNIDAD', 450.000, 100.000, 120.00, true),
('d0000000-0000-0000-0000-000000000002', 'INS-PAN-MIG', 'Pan de Miga Blanco Especial', 'PAN', 'KG', 180.000, 40.000, 1850.00, true),
('d0000000-0000-0000-0000-000000000003', 'INS-FIA-JAM', 'Jamón Cocido Primera Calidad Feteado', 'FIAMBRE', 'KG', 95.000, 25.000, 4600.00, true),
('d0000000-0000-0000-0000-000000000004', 'INS-QUE-TYB', 'Queso Tybo Especial Sandwichería', 'QUESO', 'KG', 110.000, 30.000, 4200.00, true),
('d0000000-0000-0000-0000-000000000005', 'INS-FIA-SAL', 'Salame Criollo Colonia Picado Fino', 'FIAMBRE', 'KG', 40.000, 15.000, 5800.00, true),
('d0000000-0000-0000-0000-000000000006', 'INS-ADE-MAY', 'Mayonesa Artesanal Emulsionada', 'ADEREZO', 'KG', 75.000, 20.000, 1900.00, true),
('d0000000-0000-0000-0000-000000000007', 'INS-VAR-HUE', 'Huevo Duro Seleccionado Picado', 'ADEREZO', 'KG', 30.000, 10.000, 2100.00, true),
('d0000000-0000-0000-0000-000000000008', 'INS-PAC-FIL', 'Film Termosellable y Etiquetas Fresh', 'PACKAGING', 'UNIDAD', 2500.000, 500.000, 35.00, true)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. CATÁLOGO DE PRODUCTOS (PEBETES Y TRIPLES DE MIGA)
-- ------------------------------------------------------------------------------
INSERT INTO products (id, sku, name, category, base_unit_price, shelf_life_hours, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'PEB-JYQ-01', 'Pebete Clásico Jamón y Queso', 'PEBETE', 1500.00, 24, true),
('e0000000-0000-0000-0000-000000000002', 'PEB-SYQ-02', 'Pebete Salame Criollo y Queso', 'PEBETE', 1600.00, 24, true),
('e0000000-0000-0000-0000-000000000003', 'MIG-JYQ-01', 'Triple de Miga Jamón y Queso (Pack x3)', 'MIGA_TRIPLE', 2200.00, 18, true),
('e0000000-0000-0000-0000-000000000004', 'MIG-JYH-02', 'Triple de Miga Jamón y Huevo (Pack x3)', 'MIGA_TRIPLE', 2300.00, 18, true),
('e0000000-0000-0000-0000-000000000005', 'DOC-MIG-SUR', 'Docena Triples de Miga Surtidos (x12 u.)', 'MIGA_TRIPLE', 8500.00, 18, true),
('e0000000-0000-0000-0000-000000000006', 'MIL-CMP-01', 'Sándwich de Milanesa Completo Especial', 'MILANESA', 3200.00, 12, true)
ON CONFLICT (sku) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. GASTOS OPERATIVOS DEL MES (FIJOS Y VARIABLES)
-- ------------------------------------------------------------------------------
INSERT INTO operating_expenses (id, expense_date, category, concept, amount, is_fixed_cost, voucher_number) VALUES
('f0000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '25 days', 'ALQUILER', 'Alquiler Nave de Elaboración y Cámara de Frío', 1200000.00, true, 'REC-ALQ-0926'),
('f0000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '20 days', 'SUELDOS', 'Nómina y Jornales Maestros Sandwicheros', 2800000.00, true, 'SUE-SEP-2026'),
('f0000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '15 days', 'ENERGIA', 'Factura de Energía Eléctrica Comercial (Cámaras 24/7)', 380000.00, true, 'EDEMSA-77889'),
('f0000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '12 days', 'GAS', 'Gas Industrial Cocción y Pasteurización', 110000.00, true, 'ECOGAS-11223'),
('f0000000-0000-0000-0000-000000000005', CURRENT_DATE - INTERVAL '10 days', 'MANTENIMIENTO', 'Afilado y Service Preventivo Cortadoras de Fiambre', 140000.00, true, 'FAC-SERV-992'),
('f0000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '8 days', 'PACKAGING', 'Compra de Cajas Descartables y Film Termosellable', 220000.00, false, 'FAC-PACK-441'),
('f0000000-0000-0000-0000-000000000007', CURRENT_DATE - INTERVAL '5 days', 'COMBUSTIBLE', 'Combustible y Peajes Flota de Reparto Matutino', 350000.00, false, 'YPF-COMB-339'),
('f0000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '2 days', 'OTROS', 'Insumos de Sanitización Bromatológica y Guantes', 90000.00, false, 'FAC-LIMP-110')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. PEDIDOS / VENTAS REALES CON CMV IMPUTADO (SEPTIEMBRE 2026)
-- ------------------------------------------------------------------------------

-- Orden 1: Kiosco Central (40 Pebetes JyQ, 20 Pebetes SyQ)
INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'B2B_STREET', 'DELIVERED', CURRENT_DATE - INTERVAL '7 days', '07:00 - 08:30', 92000.00, 2000.00, 90000.00, 'TRANSFER', CURRENT_TIMESTAMP - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price) VALUES
('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 40, 1500.00, 620.0000, 60000.00),
('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 20, 1600.00, 680.0000, 32000.00)
ON CONFLICT (id) DO NOTHING;

-- Orden 2: Cafetería La Estación (50 Triples JyQ, 30 Triples JyH)
INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at) VALUES
('10000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'B2B_STREET', 'DELIVERED', CURRENT_DATE - INTERVAL '5 days', '07:30 - 09:00', 179000.00, 5000.00, 174000.00, 'ACCOUNT_CREDIT', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price) VALUES
('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 50, 2200.00, 910.0000, 110000.00),
('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 30, 2300.00, 940.0000, 69000.00)
ON CONFLICT (id) DO NOTHING;

-- Orden 3: Eventos Sandra (B2C Redes - 20 Docenas Triples Surtidos + 30 Milanesas)
INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at) VALUES
('10000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'B2C_SOCIAL', 'DELIVERED', CURRENT_DATE - INTERVAL '3 days', '18:00 - 20:00', 266000.00, 6000.00, 260000.00, 'TRANSFER', CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price) VALUES
('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000005', 20, 8500.00, 3600.0000, 170000.00),
('11000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000006', 30, 3200.00, 1350.0000, 96000.00)
ON CONFLICT (id) DO NOTHING;

-- Orden 4: Despensa Don Pepe (35 Pebetes JyQ, 25 Triples JyQ)
INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at) VALUES
('10000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'B2B_STREET', 'DELIVERED', CURRENT_DATE - INTERVAL '1 days', '08:00 - 09:30', 107500.00, 2500.00, 105000.00, 'CASH', CURRENT_TIMESTAMP - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price) VALUES
('11000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 35, 1500.00, 620.0000, 52500.00),
('11000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 25, 2200.00, 910.0000, 55000.00)
ON CONFLICT (id) DO NOTHING;

-- Orden 5: Bar San Martín (Venta Grande Matutina - 80 Pebetes, 60 Triples)
INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at) VALUES
('10000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'B2B_STREET', 'DELIVERED', CURRENT_DATE, '06:30 - 08:00', 252000.00, 7000.00, 245000.00, 'TRANSFER', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price) VALUES
('11000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 80, 1500.00, 620.0000, 120000.00),
('11000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', 60, 2200.00, 910.0000, 132000.00)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. DEVOLUCIONES Y MERMAS REGISTRADAS (RN-02)
-- ------------------------------------------------------------------------------
INSERT INTO order_returns (id, order_id, client_id, product_id, quantity, credited_amount, reason, loss_amount, seller_user_id, created_at) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 4, 6000.00, 'EXPIRED_FROZEN', 2480.00, 'a0000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. MUTACIONES DE SINCRONIZACIÓN REGISTRADAS (IDEMPOTENCIA SHA-256)
-- ------------------------------------------------------------------------------
INSERT INTO processed_sync_mutations (idempotency_key, client_device_id, mutation_type, entity_id, processed_at) VALUES
('a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f801', 'FLUTTER-S23-CARLOS', 'CREATE_ORDER', '10000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('b2c3d4e5f6a10718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f802', 'FLUTTER-S23-CARLOS', 'CREATE_ORDER', '10000000-0000-0000-0000-000000000002', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('c3d4e5f6a1b20718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f803', 'FLUTTER-IPHONE15-VALERIA', 'CREATE_ORDER', '10000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (idempotency_key) DO NOTHING;

COMMIT;
