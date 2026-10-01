-- ==============================================================================
-- BUEN BOCADO ERP - V1__initial_schema.sql
-- Migración inicial de base de datos para PostgreSQL 16 con PostGIS y UUIDv7
-- ==============================================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 1. TABLAS DE SEGURIDAD Y CONTROL DE ACCESO (RBAC)
-- ------------------------------------------------------------------------------

CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO roles (id, name, description) VALUES
('ROLE_SUPER_ADMIN', 'Encargado Informático', 'Acceso irrestricto a todas las pantallas, auditoría y configuraciones'),
('ROLE_ACCOUNTING_ADMIN', 'Administrador Contable', 'Gestión financiera, compras, gastos, cuentas corrientes, EBITDA/NOF y reportes'),
('ROLE_STREET_PREVENTISTA', 'Preventista de Calle', 'Toma de pedidos B2B en calle, cobranzas, devoluciones y visualización de rutas'),
('ROLE_SOCIAL_PREVENTISTA', 'Preventista de Redes', 'Encargos B2C programados por docena, comisiones y entregas'),
('ROLE_KITCHEN_OPERATOR', 'Operario de Cocina', 'Monitor de producción JIT, consumo de recetas BOM y cierre de lotes'),
('ROLE_CASHIER', 'Cajero de Mostrador', 'Punto de venta físico, tickets rápidos y cierre de caja diaria');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ------------------------------------------------------------------------------
-- 2. CLIENTES, GEOLOCALIZACIÓN Y LISTAS DE PRECIOS
-- ------------------------------------------------------------------------------

CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(50), -- CUIT / DNI
    contact_name VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    delivery_address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326), -- PostGIS Point (Lng, Lat)
    price_list_id UUID REFERENCES price_lists(id),
    credit_limit NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    current_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL, -- Saldo acumulado (positivo = adeuda)
    client_type VARCHAR(20) NOT NULL, -- 'B2B_KIOSK', 'B2B_CAFE', 'B2C_RETAIL', 'B2C_SOCIAL'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_clients_location ON clients USING GIST (location);
CREATE INDEX idx_clients_tax_id ON clients (tax_id);

-- ------------------------------------------------------------------------------
-- 3. CATÁLOGO DE PRODUCTOS E INGREDIENTES (RECETAS / BOM)
-- ------------------------------------------------------------------------------

CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'FIAMBRE', 'QUESO', 'PAN', 'ADEREZO', 'PACKAGING'
    unit_of_measure VARCHAR(20) NOT NULL, -- 'KG', 'UNIDAD', 'LITRO'
    current_stock NUMERIC(12, 3) DEFAULT 0.000 NOT NULL,
    minimum_stock NUMERIC(12, 3) DEFAULT 0.000 NOT NULL,
    last_purchase_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'PEBETE', 'MIGA_TRIPLE', 'MILANESA', 'BEBIDA', 'OTRO'
    base_unit_price NUMERIC(12, 2) NOT NULL,
    shelf_life_hours INT DEFAULT 24 NOT NULL, -- RN-01: Frescura de 12 a 24 horas
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Precios específicos por lista de precios o volumen
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    min_volume INT DEFAULT 1 NOT NULL, -- Escala de volumen (ej: 1, 6=media docena, 12=docena)
    price NUMERIC(12, 2) NOT NULL,
    UNIQUE (product_id, price_list_id, min_volume)
);

-- Receta / Bill of Materials (BOM)
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version INT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (product_id, version)
);

CREATE TABLE recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(12, 4) NOT NULL -- Cantidad de insumo por cada unidad de producto terminado
);

-- ------------------------------------------------------------------------------
-- 4. PRODUCCIÓN JIT, LOTES Y COSTO VARIABLE (PEPS)
-- ------------------------------------------------------------------------------

CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(100) NOT NULL UNIQUE, -- Ej: L-20260928-PEB-01
    product_id UUID NOT NULL REFERENCES products(id),
    planned_units INT NOT NULL,
    actual_units_produced INT DEFAULT 0 NOT NULL,
    waste_units INT DEFAULT 0 NOT NULL, -- Unidades desechadas en elaboración
    status VARCHAR(30) DEFAULT 'PLANNED' NOT NULL, -- 'PLANNED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED'
    unit_cost_cmv NUMERIC(12, 4) DEFAULT 0.0000 NOT NULL, -- Costo unitario real calculado por insumos consumidos
    total_batch_cost NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    operator_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE batch_material_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    quantity_consumed NUMERIC(12, 4) NOT NULL,
    unit_purchase_cost NUMERIC(12, 4) NOT NULL, -- Costo específico de compra del insumo al momento del consumo
    total_cost NUMERIC(12, 2) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. COMPRAS DE INSUMOS A PROVEEDORES
-- ------------------------------------------------------------------------------

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(50),
    contact_phone VARCHAR(50),
    email VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE purchase_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    invoice_number VARCHAR(100),
    invoice_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'PAID'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. VENTAS, PEDIDOS, REPARTO Y DEVOLUCIONES (MERMAS)
-- ------------------------------------------------------------------------------

CREATE TABLE orders (
    id UUID PRIMARY KEY, -- Clave generada por el cliente (UUIDv7)
    client_id UUID NOT NULL REFERENCES clients(id),
    seller_user_id UUID NOT NULL REFERENCES users(id),
    channel VARCHAR(30) NOT NULL, -- 'B2B_STREET', 'B2C_SOCIAL', 'POS_COUNTER'
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'IN_KITCHEN', 'READY_DISPATCH', 'DELIVERED', 'CANCELLED'
    delivery_date DATE NOT NULL,
    delivery_time_slot VARCHAR(50), -- Franja horaria para producción JIT (Ej: '18:00 - 20:00')
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(30), -- 'CASH', 'TRANSFER', 'CHECK', 'ACCOUNT_CREDIT'
    server_sequence_id BIGSERIAL NOT NULL, -- Monótono para sincronización incremental
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_orders_server_seq ON orders (server_sequence_id);
CREATE INDEX idx_orders_delivery_date ON orders (delivery_date, status);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    unit_cost_cmv NUMERIC(12, 4) DEFAULT 0.0000 NOT NULL, -- CMV imputado
    total_price NUMERIC(12, 2) NOT NULL
);

-- Devoluciones y Mermas (RN-02: No reingresan a stock vendible)
CREATE TABLE order_returns (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    credited_amount NUMERIC(12, 2) NOT NULL, -- Crédito otorgado en cuenta corriente
    reason VARCHAR(100) NOT NULL, -- 'EXPIRED_FROZEN', 'DAMAGED', 'WRONG_ITEM'
    loss_amount NUMERIC(12, 2) NOT NULL, -- Pérdida neta de la fábrica (costo del producto)
    seller_user_id UUID REFERENCES users(id),
    server_sequence_id BIGSERIAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. CUENTAS CORRIENTES Y MOVIMIENTOS CONTABLES (LEDGER INMUTABLE)
-- ------------------------------------------------------------------------------

CREATE TABLE account_transactions (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    transaction_type VARCHAR(30) NOT NULL, -- 'INVOICE_DEBIT', 'PAYMENT_CREDIT', 'RETURN_CREDIT'
    reference_id UUID, -- order_id, return_id o receipt_id
    debit_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL, -- Suma deuda
    credit_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL, -- Resta deuda
    resulting_balance NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_by_user_id UUID REFERENCES users(id),
    server_sequence_id BIGSERIAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_account_transactions_client ON account_transactions (client_id, server_sequence_id);

-- ------------------------------------------------------------------------------
-- 8. GASTOS OPERATIVOS Y CAJAS DIARIAS
-- ------------------------------------------------------------------------------

CREATE TABLE operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'ALQUILER', 'SUELDOS', 'ENERGIA', 'GAS', 'COMBUSTIBLE', 'MANTENIMIENTO', 'PACKAGING', 'OTROS'
    concept VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    is_fixed_cost BOOLEAN DEFAULT TRUE NOT NULL, -- Fijo vs Variable para Punto de Equilibrio
    voucher_number VARCHAR(100),
    voucher_url TEXT, -- Almacenado en Cloud Storage
    registered_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_operating_expenses_date ON operating_expenses (expense_date, category);

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_user_id UUID NOT NULL REFERENCES users(id),
    opening_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closing_time TIMESTAMP WITH TIME ZONE,
    initial_cash NUMERIC(12, 2) NOT NULL,
    expected_cash NUMERIC(12, 2),
    actual_cash NUMERIC(12, 2),
    cash_difference NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL -- 'OPEN', 'CLOSED'
);

-- ------------------------------------------------------------------------------
-- 9. TABLAS DE CONTROL DE SINCRONIZACIÓN Y AUDITORÍA OFFLINE
-- ------------------------------------------------------------------------------

CREATE TABLE processed_sync_mutations (
    idempotency_key VARCHAR(64) PRIMARY KEY, -- Hash SHA-256 generado en el cliente
    client_device_id VARCHAR(100) NOT NULL,
    mutation_type VARCHAR(50) NOT NULL, -- 'CREATE_ORDER', 'RECORD_PAYMENT', 'RECORD_RETURN'
    entity_id UUID NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_processed_sync_device ON processed_sync_mutations (client_device_id, processed_at);
