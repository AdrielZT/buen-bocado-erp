import csv

# Analizar transacciones
with open('data_treinta_september_2026.csv', mode='r', encoding='utf-8') as f:
    lines = [line.strip() for line in f if line.strip()]

header_idx = -1
for i, line in enumerate(lines):
    if 'Fecha,Consecutivo,Tipo' in line:
        header_idx = i
        break

print(f"Header found at line {header_idx}")
reader = csv.DictReader(lines[header_idx:])

ventas = []
gastos = []
abonos = []

for row in reader:
    tipo = row.get('Tipo', '').strip()
    val = float(row.get('Valor', '0') or '0')
    if tipo == 'Venta':
        ventas.append((row, val))
    elif tipo == 'Gasto':
        gastos.append((row, val))
    elif tipo == 'Abonos ventas':
        abonos.append((row, val))

print(f"Total filas Venta: {len(ventas)}, Monto suma: {sum(v[1] for v in ventas)}")
print(f"Total filas Gasto: {len(gastos)}, Monto suma: {sum(g[1] for g in gastos)}")
print(f"Total filas Abonos ventas: {len(abonos)}, Monto suma: {sum(a[1] for a in abonos)}")

# Desglose de Gastos por categoría de Treinta
cat_gastos = {}
for r, val in gastos:
    cat = r.get('Categoría de gasto', '').strip()
    cat_gastos[cat] = cat_gastos.get(cat, 0) + val

print("\n--- GASTOS POR CATEGORÍA EN TREINTA ---")
for cat, total in sorted(cat_gastos.items(), key=lambda x: x[1], reverse=True):
    print(f"  {cat}: ${total:,.2f}")

# Analizar productos vendidos
with open('data_treinta_products_september_2026.csv', mode='r', encoding='utf-8') as f:
    prod_lines = [l.strip() for l in f if l.strip()]

prod_header_idx = -1
for i, line in enumerate(prod_lines):
    if 'Fecha,Consecutivo,Tipo' in line:
        prod_header_idx = i
        break

prod_reader = csv.DictReader(prod_lines[prod_header_idx:])
products_sold = {}
total_prod_val = 0
total_prod_cost = 0
total_prod_units = 0

for row in prod_reader:
    pname = row.get('Producto', '').strip()
    cant = float(row.get('Cant.', '0') or '0')
    total = float(row.get('Total', '0') or '0')
    costo_unit = float(row.get('Costo', '0') or '0')
    total_cost = cant * costo_unit
    
    total_prod_units += cant
    total_prod_val += total
    total_prod_cost += total_cost
    
    if pname not in products_sold:
        products_sold[pname] = {'cant': 0, 'total': 0, 'costo': 0}
    products_sold[pname]['cant'] += cant
    products_sold[pname]['total'] += total
    products_sold[pname]['costo'] += total_cost

print(f"\n--- PRODUCTOS VENDIDOS EN SEPTIEMBRE (DETALLE) ---")
print(f"Total unidades vendidas: {total_prod_units}")
print(f"Total facturado productos: ${total_prod_val:,.2f}")
print(f"Total costo productos (CMV registrado en Treinta): ${total_prod_cost:,.2f}")
print(f"Margen Bruto según Treinta: ${total_prod_val - total_prod_cost:,.2f} ({((total_prod_val - total_prod_cost)/total_prod_val)*100:.2f}%)")

print("\nTop productos por volumen:")
for p, data in sorted(products_sold.items(), key=lambda x: x[1]['cant'], reverse=True)[:10]:
    print(f"  {p}: {data['cant']} u. | Venta: ${data['total']:,.2f} | Costo: ${data['costo']:,.2f}")
