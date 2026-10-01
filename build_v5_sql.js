const fs = require('fs');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// 1. Cargar Transacciones
const txRaw = fs.readFileSync('data_treinta_september_2026.csv', 'utf-8');
const txLines = txRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
let txHeaderIdx = -1;
for (let i = 0; i < txLines.length; i++) {
  if (txLines[i].includes('Fecha') && txLines[i].includes('Consecutivo') && txLines[i].includes('Tipo')) {
    txHeaderIdx = i;
    break;
  }
}
const txCols = parseCSVLine(txLines[txHeaderIdx]).map(c => c.trim());
const transactions = [];
const txByConsecutivo = {};
for (let i = txHeaderIdx + 1; i < txLines.length; i++) {
  const cols = parseCSVLine(txLines[i]);
  const row = {};
  txCols.forEach((col, idx) => {
    if (col) row[col] = (cols[idx] || '').trim();
  });
  transactions.push(row);
  if (row.Consecutivo) txByConsecutivo[row.Consecutivo] = row;
}

// 2. Cargar Productos Detallados
const prodRaw = fs.readFileSync('data_treinta_products_september_2026.csv', 'utf-8');
const pLines = prodRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
let pHeaderIdx = -1;
for (let i = 0; i < pLines.length; i++) {
  if (pLines[i].includes('Fecha') && pLines[i].includes('Consecutivo') && pLines[i].includes('Producto')) {
    pHeaderIdx = i;
    break;
  }
}
const pCols = parseCSVLine(pLines[pHeaderIdx]).map(c => c.trim());
const productsRows = [];
for (let i = pHeaderIdx + 1; i < pLines.length; i++) {
  const cols = parseCSVLine(pLines[i]);
  const row = {};
  pCols.forEach((col, idx) => {
    if (col) row[col] = (cols[idx] || '').trim();
  });
  productsRows.push(row);
}

// Agrupar productos por Consecutivo
const itemsByConsecutivo = {};
productsRows.forEach(pr => {
  const c = pr.Consecutivo;
  if (!itemsByConsecutivo[c]) itemsByConsecutivo[c] = [];
  itemsByConsecutivo[c].push(pr);
});

// Map de clientes a UUIDs
const clientMap = {
  'Super Ana': 'c0000001-0000-0000-0000-000000000030',
  'El Control': 'c0000001-0000-0000-0000-000000000031',
  'Maria Lopez': 'c0000001-0000-0000-0000-000000000032',
  'oasis': 'c0000001-0000-0000-0000-000000000033',
  'Liliana Cafeteria': 'c0000001-0000-0000-0000-000000000034',
  'Consumidor Final': 'c0000001-0000-0000-0000-000000000035',
  'Marta Alarcon Polleria Alita': 'c0000001-0000-0000-0000-000000000019',
  'El tigre': 'c0000001-0000-0000-0000-000000000012',
  'Eugenia': 'c0000001-0000-0000-0000-000000000014',
  'Marisel Nano Electronica': 'c0000001-0000-0000-0000-000000000022',
  'Isamara "La Paz"': 'c0000001-0000-0000-0000-000000000020'
};

// Map de productos a UUIDs
const productMap = {
  'Sandwich de pebete de Jamón y Queso': 'b0000001-0000-0000-0000-000000000001',
  'Sandwich de Pebete de Salame y Queso': 'b0000001-0000-0000-0000-000000000002',
  'Sandwich de Miga de Jamón y Queso': 'b0000001-0000-0000-0000-000000000003',
  'Milanesa': 'b0000001-0000-0000-0000-000000000004',
  'Sandwich de Pebete de Ternera, Tomate y queso': 'b0000001-0000-0000-0000-000000000005',
  'Sandwich de Miga de Salame y Queso': 'b0000001-0000-0000-0000-000000000006',
  'Sandwich de Miga de Ternera y Queso': 'b0000001-0000-0000-0000-000000000007',
  'Super Miga JyQ': 'b0000001-0000-0000-0000-000000000010',
  'Super Miga Salame': 'b0000001-0000-0000-0000-000000000011',
  'Super Pebete Jyq': 'b0000001-0000-0000-0000-000000000012',
  'Super Pebete Salame': 'b0000001-0000-0000-0000-000000000013',
  'Docena de Miga de J&Q': 'b0000001-0000-0000-0000-000000000014',
  'Docena de Miga de T&Q': 'b0000001-0000-0000-0000-000000000015',
  'Docena Miga salame': 'b0000001-0000-0000-0000-000000000016',
  'Media Docena de Miga J&Q': 'b0000001-0000-0000-0000-000000000017',
  'Media docena de Miga de S&Q': 'b0000001-0000-0000-0000-000000000018',
  'Media docena de miga de T&Q': 'b0000001-0000-0000-0000-000000000019',
  'Media docena de pebete de S&Q': 'b0000001-0000-0000-0000-000000000020',
  'envio': 'b0000001-0000-0000-0000-000000000021'
};

const sql = [];

sql.push(`-- =========================================================================`);
sql.push(`-- V5: CARGA MASIVA DE DATOS REALES DE SEPTIEMBRE 2026 (SISTEMA TREINTA)`);
sql.push(`-- =========================================================================`);
sql.push(`\n-- 1. Limpieza de datos previos de septiembre`);
sql.push(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE delivery_date >= '2026-09-01' AND delivery_date <= '2026-09-30');`);
sql.push(`DELETE FROM orders WHERE delivery_date >= '2026-09-01' AND delivery_date <= '2026-09-30';`);
sql.push(`DELETE FROM operating_expenses WHERE expense_date >= '2026-09-01' AND expense_date <= '2026-09-30';\n`);

sql.push(`-- 2. Clientes adicionales de Treinta`);
sql.push(`INSERT INTO clients (id, business_name, contact_name, phone, delivery_address, credit_limit, current_balance, client_type, is_active) VALUES`);
sql.push(`('c0000001-0000-0000-0000-000000000030', 'Super Ana', 'Ana', '387-550-0001', 'Av. San Martín 820', 250000.00, 0.00, 'B2B_KIOSK', true),`);
sql.push(`('c0000001-0000-0000-0000-000000000031', 'Kiosco El Control', 'Encargado Control', '387-550-0002', 'Ruta 9 Km 12', 150000.00, 0.00, 'B2B_KIOSK', true),`);
sql.push(`('c0000001-0000-0000-0000-000000000032', 'Kiosco María López', 'María López', '387-550-0003', 'Alvarado 450', 120000.00, 0.00, 'B2B_KIOSK', true),`);
sql.push(`('c0000001-0000-0000-0000-000000000033', 'Kiosco Oasis', 'Titular Oasis', '387-550-0004', 'Mitre 610', 180000.00, 0.00, 'B2B_KIOSK', true),`);
sql.push(`('c0000001-0000-0000-0000-000000000034', 'Liliana Cafetería', 'Liliana', '387-550-0005', 'Caseros 230', 200000.00, 0.00, 'B2B_CAFE', true),`);
sql.push(`('c0000001-0000-0000-0000-000000000035', 'Consumidor Final (Mostrador)', 'Venta Directa', '387-553-7668', 'Local Planta San Martín', 0.00, 0.00, 'B2C_RETAIL', true)`);
sql.push(`ON CONFLICT (id) DO NOTHING;\n`);

sql.push(`-- 3. Proveedores adicionales de Treinta`);
sql.push(`INSERT INTO suppliers (id, business_name, tax_id, contact_phone, email, is_active) VALUES`);
sql.push(`('d0000001-0000-0000-0000-000000000006', 'Distribuidora El Milagro (Quesos y Fiambres)', '30-71442299-8', '387-440-1122', 'ventas@elmilagro.com', true),`);
sql.push(`('d0000001-0000-0000-0000-000000000007', 'Panificadora Las Flores', '30-68991122-3', '387-440-3344', 'pedidos@lasflores.com', true),`);
sql.push(`('d0000001-0000-0000-0000-000000000008', 'ARCA (Rentas y Tasas Municipales)', '30-99999999-9', '387-431-0000', 'arca@salta.gob.ar', true)`);
sql.push(`ON CONFLICT (id) DO NOTHING;\n`);

sql.push(`-- 4. Productos adicionales de Treinta`);
sql.push(`INSERT INTO products (id, sku, name, category, base_unit_price, shelf_life_hours, is_active) VALUES`);
sql.push(`('b0000001-0000-0000-0000-000000000010', 'SAN-SPM-JYQ', 'Super Miga JyQ', 'MIGA_TRIPLE', 2500.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000011', 'SAN-SPM-SYQ', 'Super Miga Salame', 'MIGA_TRIPLE', 2500.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000012', 'SAN-SPB-JYQ', 'Super Pebete Jyq', 'PEBETE', 2000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000013', 'SAN-SPB-SYQ', 'Super Pebete Salame', 'PEBETE', 2000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000014', 'DOC-MIG-JYQ', 'Docena de Miga de J&Q', 'MIGA_TRIPLE', 16000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000015', 'DOC-MIG-TER', 'Docena de Miga de T&Q', 'MIGA_TRIPLE', 18000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000016', 'DOC-MIG-SAL', 'Docena Miga salame', 'MIGA_TRIPLE', 18000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000017', 'MDOC-MIG-JYQ', 'Media Docena de Miga J&Q', 'MIGA_TRIPLE', 9000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000018', 'MDOC-MIG-SAL', 'Media docena de Miga de S&Q', 'MIGA_TRIPLE', 9000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000019', 'MDOC-MIG-TER', 'Media docena de miga de T&Q', 'MIGA_TRIPLE', 9000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000020', 'MDOC-PEB-SAL', 'Media docena de pebete de S&Q', 'PEBETE', 9000.00, 24, true),`);
sql.push(`('b0000001-0000-0000-0000-000000000021', 'SRV-ENV-FLE', 'Servicio de Envío', 'OTRO', 2000.00, 24, true)`);
sql.push(`ON CONFLICT (id) DO NOTHING;\n`);

// 5. Cargar Compras de Insumos ($2.167.257,68) y Gastos Operativos ($1.385.024)
sql.push(`-- 5. Compras de Insumos & Gastos Operativos Reales de Septiembre (121 registros)`);
const expenses = transactions.filter(t => t.Tipo === 'Gasto');
let expSeq = 1;
const expValues = [];

expenses.forEach(e => {
  const dt = e.Fecha ? e.Fecha.split(' ')[0] : '2026-09-15';
  const val = parseFloat(e.Valor) || 0;
  const rawCat = e['Categoría de gasto'] || '';
  const desc = (e.Descripción || 'Gasto operativo').replace(/'/g, "''");
  const contacto = (e.Contacto || '').replace(/'/g, "''");
  
  let cat = 'OTROS';
  let isFixed = false;

  if (rawCat.includes('Compra de productos e insumos')) {
    cat = 'INSUMOS';
    isFixed = false;
  } else if (rawCat.includes('Nómina')) {
    cat = 'SUELDOS';
    isFixed = true;
  } else if (rawCat.includes('Arriendo')) {
    cat = 'ALQUILER';
    isFixed = true;
  } else if (rawCat.includes('Transporte')) {
    cat = 'COMBUSTIBLE';
    isFixed = false;
  } else if (rawCat.includes('Mercadeo')) {
    cat = 'PACKAGING';
    isFixed = false;
  } else if (rawCat.includes('Servicios públicos')) {
    cat = 'ENERGIA';
    isFixed = true;
  } else {
    cat = 'OTROS';
    isFixed = false;
  }

  const voucher = `TR-${e.Consecutivo || expSeq}`;
  const fullConcept = contacto && contacto !== '-' ? `${desc} (${contacto})` : desc;
  
  expValues.push(`('${dt}', '${cat}', '${fullConcept}', ${val.toFixed(2)}, ${isFixed}, '${voucher}', '00000001-0000-0000-0000-000000000001')`);
  expSeq++;
});

sql.push(`INSERT INTO operating_expenses (expense_date, category, concept, amount, is_fixed_cost, voucher_number, registered_by_user_id) VALUES\n` + expValues.join(',\n') + ';\n');

// 6. Cargar TODAS las Órdenes de Venta Reales de Septiembre (114 detalladas + 7 mostrador = 121 pedidos)
sql.push(`-- 6. Órdenes de Venta Reales de Septiembre (121 pedidos / 516 ítems)`);
let ordIdx = 1;
const orderInserts = [];
const itemInserts = [];
const processedConsecutivos = new Set();

// 6.1 Órdenes con desglose de ítems (114 pedidos)
Object.entries(itemsByConsecutivo).forEach(([consecutivo, items]) => {
  processedConsecutivos.add(consecutivo);
  const firstItem = items[0];
  const tx = txByConsecutivo[consecutivo];
  const dt = (firstItem.Fecha || (tx && tx.Fecha) || '2026-09-15').split(' ')[0];
  const rawDate = firstItem.Fecha || (tx && tx.Fecha) || '2026-09-15 08:00:00';
  
  const clientName = firstItem.Contacto && clientMap[firstItem.Contacto] 
    ? firstItem.Contacto 
    : (tx && tx.Contacto && clientMap[tx.Contacto] ? tx.Contacto : 'Consumidor Final');
  const clientId = clientMap[clientName] || 'c0000001-0000-0000-0000-000000000035';
  
  const orderId = `00000005-0000-0000-0000-${String(ordIdx).padStart(12, '0')}`;
  
  let orderTotal = 0;
  items.forEach((it, itIdx) => {
    const pName = it.Producto;
    const pId = productMap[pName] || 'b0000001-0000-0000-0000-000000000001';
    const cant = parseInt(it['Cant.']) || 1;
    const pUnit = parseFloat(it['Precio unitario']) || 0;
    const pCost = parseFloat(it['Costo']) || 0;
    const pTotal = parseFloat(it['Total']) || (cant * pUnit);
    orderTotal += pTotal;
    
    const itemId = `00000006-${String(ordIdx).padStart(4, '0')}-0000-0000-${String(itIdx+1).padStart(12, '0')}`;
    itemInserts.push(`('${itemId}', '${orderId}', '${pId}', ${cant}, ${pUnit.toFixed(2)}, ${pCost.toFixed(4)}, ${pTotal.toFixed(2)})`);
  });

  const mPago = tx ? (tx['M. de pago'] === 'Mercado Pago' ? 'TRANSFER' : (tx['M. de pago'] === 'Efectivo' ? 'CASH' : 'ACCOUNT_CREDIT')) : 'CASH';
  const channel = clientId === 'c0000001-0000-0000-0000-000000000035' ? 'B2C_RETAIL' : 'B2B_STREET';
  
  orderInserts.push(`('${orderId}', '${clientId}', '00000001-0000-0000-0000-000000000001', '${channel}', 'DELIVERED', '${dt}', '07:00 - 09:30', ${orderTotal.toFixed(2)}, 0.00, ${orderTotal.toFixed(2)}, '${mPago}', '${rawDate}')`);
  ordIdx++;
});

// 6.2 Ventas directas adicionales de transactions sin SKU (7 ventas directas)
const remainingSales = transactions.filter(t => t.Tipo === 'Venta' && !processedConsecutivos.has(t.Consecutivo));
remainingSales.forEach(s => {
  const dt = s.Fecha ? s.Fecha.split(' ')[0] : '2026-09-15';
  const val = parseFloat(s.Valor) || 0;
  const desc = parseFloat(s.Descuento) || 0;
  const subtotal = val + desc;
  const clientName = s.Contacto && clientMap[s.Contacto] ? s.Contacto : 'Consumidor Final';
  const clientId = clientMap[clientName] || 'c0000001-0000-0000-0000-000000000035';
  const mPago = s['M. de pago'] === 'Mercado Pago' ? 'TRANSFER' : (s['M. de pago'] === 'Efectivo' ? 'CASH' : 'ACCOUNT_CREDIT');
  const channel = clientId === 'c0000001-0000-0000-0000-000000000035' ? 'B2C_RETAIL' : 'B2B_STREET';
  
  const orderId = `00000005-0000-0000-0000-${String(ordIdx).padStart(12, '0')}`;
  orderInserts.push(`('${orderId}', '${clientId}', '00000001-0000-0000-0000-000000000001', '${channel}', 'DELIVERED', '${dt}', '07:00 - 09:30', ${subtotal.toFixed(2)}, ${desc.toFixed(2)}, ${val.toFixed(2)}, '${mPago}', '${s.Fecha}')`);
  
  const itemId = `00000006-${String(ordIdx).padStart(4, '0')}-0000-0000-000000000001`;
  itemInserts.push(`('${itemId}', '${orderId}', 'b0000001-0000-0000-0000-000000000001', 1, ${val.toFixed(2)}, ${(val*0.5).toFixed(4)}, ${val.toFixed(2)})`);
  ordIdx++;
});

sql.push(`INSERT INTO orders (id, client_id, seller_user_id, channel, status, delivery_date, delivery_time_slot, subtotal, discount_amount, total_amount, payment_method, created_at) VALUES\n` + orderInserts.join(',\n') + ';\n');

sql.push(`INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, unit_cost_cmv, total_price) VALUES\n` + itemInserts.join(',\n') + ';\n');

// 7. Cobranzas a Cuentas Corrientes (Abonos ventas puras)
sql.push(`-- 7. Actualización de Saldos por Cobranzas Reales de Septiembre`);
const pureAbonos = transactions.filter(t => t.Tipo === 'Abonos ventas' && !processedConsecutivos.has(t.Consecutivo));
const clientAbonos = {};
pureAbonos.forEach(a => {
  const cName = a.Contacto;
  if (cName && clientMap[cName]) {
    const val = parseFloat(a.Valor) || 0;
    clientAbonos[cName] = (clientAbonos[cName] || 0) + val;
  }
});

Object.entries(clientAbonos).forEach(([cName, totalAbono]) => {
  const cId = clientMap[cName];
  sql.push(`UPDATE clients SET current_balance = GREATEST(0, current_balance - ${totalAbono.toFixed(2)}) WHERE id = '${cId}';`);
});

fs.writeFileSync('backend/src/main/resources/db/migration/V5__seed_september_treinta_real_data.sql', sql.join('\n'), 'utf-8');
console.log('Migración Flyway V5 generada exitosamente en backend/src/main/resources/db/migration/V5__seed_september_treinta_real_data.sql');
console.log(`Total Órdenes: ${orderInserts.length}, Total Ítems: ${itemInserts.length}, Total Gastos: ${expValues.length}`);
