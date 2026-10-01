const fs = require('fs');

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

// 1. Leer Transacciones
const txRaw = fs.readFileSync('data_treinta_september_2026.csv', 'utf-8');
const txLines = txRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
let txHeaderIdx = -1;
for (let i = 0; i < txLines.length; i++) {
  if (txLines[i].includes('Fecha,Consecutivo,Tipo')) {
    txHeaderIdx = i;
    break;
  }
}
const txCols = parseCSVLine(txLines[txHeaderIdx]).map(c => c.trim());
const transactions = [];
for (let i = txHeaderIdx + 1; i < txLines.length; i++) {
  const cols = parseCSVLine(txLines[i]);
  const row = {};
  txCols.forEach((col, idx) => {
    if (col) row[col] = (cols[idx] || '').trim();
  });
  transactions.push(row);
}

// 2. Leer Productos
const prodRaw = fs.readFileSync('data_treinta_products_september_2026.csv', 'utf-8');
const pLines = prodRaw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
let pHeaderIdx = -1;
for (let i = 0; i < pLines.length; i++) {
  if (pLines[i].includes('Fecha,Consecutivo,Tipo')) {
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

console.log(`Transacciones: ${transactions.length}, Líneas de productos: ${productsRows.length}`);

// Agrupar productos por Consecutivo
const productsByConsecutivo = {};
productsRows.forEach(pr => {
  const c = pr.Consecutivo;
  if (!productsByConsecutivo[c]) productsByConsecutivo[c] = [];
  productsByConsecutivo[c].push(pr);
});

console.log(`Consecutivos con productos: ${Object.keys(productsByConsecutivo).length}`);

// Clientes únicos en Treinta
const clientNames = new Set();
transactions.forEach(t => {
  const c = t.Contacto;
  if (c && c !== '-' && c !== 'No Aplica') clientNames.add(c);
});
productsRows.forEach(p => {
  const c = p.Contacto;
  if (c && c !== '-' && c !== 'No Aplica') clientNames.add(c);
});

console.log('Clientes identificados:', Array.from(clientNames));

// Productos únicos en Treinta
const prodNames = new Set();
productsRows.forEach(p => {
  if (p.Producto) prodNames.add(p.Producto);
});
console.log('Productos identificados:', Array.from(prodNames));
