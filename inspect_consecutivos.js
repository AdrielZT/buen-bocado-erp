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

const pRaw = fs.readFileSync('data_treinta_products_september_2026.csv', 'utf-8');
const pLines = pRaw.split(/\r?\n/).slice(1);

const prods = new Set();
pLines.forEach(l => {
  const cols = parseCSVLine(l);
  const p = cols[6];
  if (p && p.trim()) prods.add(p.trim());
});

console.log('All unique products in Treinta:');
Array.from(prods).forEach(p => console.log(' -', p));
