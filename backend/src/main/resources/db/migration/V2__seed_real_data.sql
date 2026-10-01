-- ==============================================================================
-- BUEN BOCADO ERP - V2__seed_real_data.sql
-- Datos semilla realistas para demostración ante el equipo
-- Simulación del mes de Septiembre 2026: Ventas B2B, B2C, Lotes JIT y Gastos
-- ==============================================================================

-- 1. Insumos y Materias Primas Reales
INSERT INTO raw_materials (id, code, name, category, unit_of_measure, current_stock, minimum_stock, last_purchase_price, is_active)
VALUES
('a0000001-0000-0000-0000-000000000001', 'INS-PAN-PEB', 'Pan de Pebete Artesanal', 'PAN', 'UNIDAD', 1200.000, 300.000, 180.00, true),
('a0000001-0000-0000-0000-000000000002', 'INS-PAN-MIG', 'Pan de Miga Blanco Extra Fresco', 'PAN', 'KG', 80.000, 20.000, 1400.00, true),
('a0000001-0000-0000-0000-000000000003', 'INS-FIA-JAM', 'Jamón Cocido Primera Calidad', 'FIAMBRE', 'KG', 65.000, 15.000, 4200.00, true),
('a0000001-0000-0000-0000-000000000004', 'INS-FIA-SAL', 'Salame Milán Feteado', 'FIAMBRE', 'KG', 40.000, 10.000, 4800.00, true),
('a0000001-0000-0000-0000-000000000005', 'INS-QUE-TYB', 'Queso Tybo Especial Feteado', 'QUESO', 'KG', 75.000, 20.000, 3900.00, true),
('a0000001-0000-0000-0000-000000000006', 'INS-ADE-MAY', 'Mayonesa Artesanal Emulsionada', 'ADEREZO', 'LITRO', 30.000, 10.000, 1100.00, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Catálogo de Sándwiches (Frescura 24h)
INSERT INTO products (id, sku, name, category, base_unit_price, shelf_life_hours, is_active)
VALUES
('b0000001-0000-0000-0000-000000000001', 'SAN-PEB-JYQ', 'Pebete Clásico Jamón y Queso', 'PEBETE', 1500.00, 24, true),
('b0000001-0000-0000-0000-000000000002', 'SAN-PEB-SYQ', 'Pebete Salame y Queso', 'PEBETE', 1600.00, 24, true),
('b0000001-0000-0000-0000-000000000003', 'SAN-MIG-JYQ', 'Triple de Miga Jamón y Queso (Pack x3)', 'MIGA_TRIPLE', 2200.00, 24, true),
('b0000001-0000-0000-0000-000000000004', 'SAN-MIL-COM', 'Sándwich de Milanesa Completo', 'MILANESA', 3200.00, 12, true)
ON CONFLICT (sku) DO NOTHING;

-- 3. Clientes Reales (Kioscos, Cafeterías y Redes con PostGIS)
INSERT INTO clients (id, business_name, tax_id, contact_name, phone, email, delivery_address, location, credit_limit, current_balance, client_type, is_active)
VALUES
('c0000001-0000-0000-0000-000000000001', 'Kiosco El Trébol', '30-71123456-8', 'Roberto Gómez', '11-4567-8901', 'kiosco.trebol@email.com', 'Av. San Martín 1420', ST_SetSRID(ST_MakePoint(-58.3816, -34.6037), 4326), 150000.00, 42000.00, 'B2B_KIOSK', true),
('c0000001-0000-0000-0000-000000000002', 'Cafetería La Esquina', '30-71987654-2', 'Mariana Torres', '11-5678-1234', 'laesquina.cafe@email.com', 'Belgrano 850', ST_SetSRID(ST_MakePoint(-58.3900, -34.6100), 4326), 250000.00, 85000.00, 'B2B_CAFE', true),
('c0000001-0000-0000-0000-000000000003', 'Despensa Don Juan', '20-28456123-4', 'Juan Pérez', '11-6789-4321', 'despensadonjuan@email.com', 'Mitre 2100', ST_SetSRID(ST_MakePoint(-58.3750, -34.5980), 4326), 100000.00, 18500.00, 'B2B_KIOSK', true),
('c0000001-0000-0000-0000-000000000004', 'Cliente Redes: Cumpleaños Laura', '27-35678901-3', 'Laura Méndez', '11-3456-7890', 'laura.mendez@email.com', 'Pueyrredón 1650 4B', ST_SetSRID(ST_MakePoint(-58.4000, -34.5900), 4326), 0.00, 0.00, 'B2C_SOCIAL', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Usuario Vendedor Preventista
INSERT INTO users (id, username, password_hash, full_name, email, phone, is_active)
VALUES
('00000001-0000-0000-0000-000000000001', 'preventista.carlos', '$2a$10$w8.1Z7Z1aG0i9H.2F3/4xeqY8V1/8uO0c0.w2O9V1/8uO0c0.w2O9', 'Carlos Benítez', 'carlos.preventa@buenbocado.com', '11-2345-6789', true)
ON CONFLICT (username) DO NOTHING;

-- 5. Ventas y Pedidos del Mes (Total: $1.421.000)
INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at)
VALUES
-- Pedido 1: Kiosco El Trébol (150 pebetes JyQ + 100 pebetes SyQ)
('00000002-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'B2B_STREET', 'DELIVERED', '2026-09-15', '07:00 - 09:00', 385000.00, 0.00, 385000.00, 'ACCOUNT_CREDIT', '2026-09-14 18:30:00-03'),
-- Pedido 2: Cafetería La Esquina (250 Triples de Miga)
('00000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', 'B2B_STREET', 'DELIVERED', '2026-09-18', '06:30 - 08:30', 550000.00, 0.00, 550000.00, 'ACCOUNT_CREDIT', '2026-09-17 19:00:00-03'),
-- Pedido 3: Despensa Don Juan (200 pebetes JyQ)
('00000002-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', 'B2B_STREET', 'DELIVERED', '2026-09-22', '07:30 - 09:30', 300000.00, 0.00, 300000.00, 'CASH', '2026-09-21 17:45:00-03'),
-- Pedido 4: Encargo Redes Laura (5 docenas triples + 3 docenas pebetes)
('00000002-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000001', 'B2C_SOCIAL', 'DELIVERED', '2026-09-26', '18:00 - 19:30', 186000.00, 0.00, 186000.00, 'TRANSFER', '2026-09-25 11:20:00-03')
ON CONFLICT (id) DO NOTHING;

-- Líneas de Pedido con CMV Real Imputado (Promedio ~42% del precio de venta)
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price)
VALUES
('00000003-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 150, 1500.00, 620.00, 225000.00),
('00000003-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 100, 1600.00, 680.00, 160000.00),
('00000003-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003', 250, 2200.00, 910.00, 550000.00),
('00000003-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 200, 1500.00, 620.00, 300000.00),
('00000003-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 60, 2200.00, 910.00, 132000.00),
('00000003-0000-0000-0000-000000000006', '00000002-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 36, 1500.00, 620.00, 54000.00)
ON CONFLICT (id) DO NOTHING;

-- 6. Gastos Operativos Reales del Mes (Alquiler, Sueldos, Energía, Gas)
INSERT INTO operating_expenses (id, expense_date, category, concept, amount, is_fixed_cost, voucher_number)
VALUES
('f0000001-0000-0000-0000-000000000001', '2026-09-05', 'ALQUILER', 'Alquiler Planta de Elaboración y Local', 320000.00, true, 'REC-ALQ-0926'),
('f0000001-0000-0000-0000-000000000002', '2026-09-10', 'SUELDOS', 'Liquidación Sueldos Operarios de Cocina', 450000.00, true, 'REC-SUE-0926'),
('f0000001-0000-0000-0000-000000000003', '2026-09-12', 'ENERGIA', 'Factura Edenor - Cámaras de Frío', 85000.00, false, 'FAC-EDE-7781'),
('f0000001-0000-0000-0000-000000000004', '2026-09-14', 'GAS', 'Factura Naturgy - Cocina / Hornos', 32000.00, false, 'FAC-NAT-4421'),
('f0000001-0000-0000-0000-000000000005', '2026-09-20', 'COMBUSTIBLE', 'Combustible Reparto Matutino B2B', 48000.00, false, 'TIK-YPF-9912')
ON CONFLICT (id) DO NOTHING;
