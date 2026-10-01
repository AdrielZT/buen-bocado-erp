const fs = require('fs');

const rawContent = fs.readFileSync('data_treinta_september_2026.csv', 'utf-8');
const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

let headerIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Fecha,Consecutivo,Tipo')) {
    headerIdx = i;
    break;
  }
}

console.log('Header line found at:', headerIdx);

// Parser simple para líneas CSV con comillas
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

const headerCols = parseCSVLine(lines[headerIdx]).map(c => c.trim());
console.log('Columns:', headerCols);

const rows = [];
for (let i = headerIdx + 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const row = {};
  headerCols.forEach((col, idx) => {
    if (col) row[col] = (cols[idx] || '').trim();
  });
  rows.push(row);
}

const ventas = rows.filter(r => r.Tipo === 'Venta');
const gastos = rows.filter(r => r.Tipo === 'Gasto');
const abonos = rows.filter(r => r.Tipo === 'Abonos ventas');

const sumVentas = ventas.reduce((acc, r) => acc + (parseFloat(r.Valor) || 0), 0);
const sumGastos = gastos.reduce((acc, r) => acc + (parseFloat(r.Valor) || 0), 0);
const sumAbonos = abonos.reduce((acc, r) => acc + (parseFloat(r.Valor) || 0), 0);

console.log(`\n=== RESUMEN TREINTA SEPTIEMBRE ===`);
console.log(`Filas Venta directa: ${ventas.length} | Total: $${sumVentas.toLocaleString('es-AR')}`);
console.log(`Filas Abonos ventas (Cobranza B2B): ${abonos.length} | Total: $${sumAbonos.toLocaleString('es-AR')}`);
console.log(`Total dinero ventas/cobros: $${(sumVentas + sumAbonos).toLocaleString('es-AR')}`);
console.log(`Filas Gasto: ${gastos.length} | Total: $${sumGastos.toLocaleString('es-AR')}`);

const catGastos = {};
gastos.forEach(g => {
  const cat = g['Categoría de gasto'] || 'Sin Categoria';
  const val = parseFloat(g.Valor) || 0;
  catGastos[cat] = (catGastos[cat] || 0) + val;
});

console.log(`\n=== GASTOS POR CATEGORÍA EN TREINTA ===`);
Object.entries(catGastos).sort((a,b) => b[1] - a[1]).forEach(([cat, val]) => {
  console.log(`  ${cat}: $${val.toLocaleString('es-AR', {minimumFractionDigits: 2})}`);
});

// Analizar Productos
const prodRaw = fs.readFileSync('data_treinta_products_september_2026.csv', 'utf-8');
const pLines = prodRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
let pHeaderIdx = -1;
for (let i = 0; i < pLines.length; i++) {
  if (pLines[i].includes('Fecha,Consecutivo,Tipo')) {
    pHeaderIdx = i;
    break;
  }
}
const pHeaderCols = parseCSVLine(pLines[pHeaderIdx]).map(c => c.trim());
const pRows = [];
for (let i = pHeaderIdx + 1; i < pLines.length; i++) {
  const cols = parseCSVLine(pLines[i]);
  const row = {};
  pHeaderCols.forEach((col, idx) => {
    if (col) row[col] = (cols[idx] || '').trim();
  });
  pRows.push(row);
}

let totalUnits = 0;
let totalSalesProd = 0;
let totalCostProd = 0;
const prodSummary = {};

pRows.forEach(r => {
  const cant = parseFloat(r['Cant.']) || 0;
  const total = parseFloat(r.Total) || 0;
  const costUnit = parseFloat(r.Costo) || 0;
  const costTotal = cant * costUnit;
  const name = r.Producto || 'Sin Nombre';

  totalUnits += cant;
  totalSalesProd += total;
  totalCostProd += costTotal;

  if (!prodSummary[name]) {
    prodSummary[name] = { cant: 0, total: 0, cost: 0 };
  }
  prodSummary[name].cant += cant;
  prodSummary[name].total += total;
  prodSummary[name].cost += costTotal;
});

console.log(`\n=== PRODUCTOS VENDIDOS DETALLADOS (LINEAS DE VENTA) ===`);
console.log(`Total registros productos: ${pRows.length}`);
console.log(`Total unidades físicas: ${totalUnits}`);
console.log(`Facturación teórica según líneas: $${totalSalesProd.toLocaleString('es-AR', {minimumFractionDigits: 2})}`);
console.log(`Costo insumos (CMV registrado en Treinta): $${totalCostProd.toLocaleString('es-AR', {minimumFractionDigits: 2})}`);
console.log(`Margen Bruto de productos: $${(totalSalesProd - totalCostProd).toLocaleString('es-AR', {minimumFractionDigits: 2})} (${((totalSalesProd - totalCostProd)/totalSalesProd*100).toFixed(2)}%)`);

console.log(`\nTop 10 Productos por volumen de unidades:`);
Object.entries(prodSummary).sort((a,b) => b[1].cant - a[1].cant).slice(0, 10).forEach(([name, d]) => {
  console.log(`  ${name}: ${d.cant} u. | Venta: $${d.total.toLocaleString('es-AR')} | Costo: $${d.cost.toLocaleString('es-AR')}`);
});
