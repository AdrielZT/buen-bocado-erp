const http = require('http');

http.get('http://localhost:8080/api/v1/finance/dashboard?startDate=2026-09-01&endDate=2026-09-30', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('================================================================');
    console.log('       REPORTE FINANCIERO SEPTIEMBRE 2026 (BUEN BOCADO ERP)     ');
    console.log('================================================================');
    console.log('Período:', `${json.startDate} al ${json.endDate}`);
    console.log('Total Facturado (Sales):', Number(json.totalSales).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('Costo Mercadería Vendida (CMV PEPS/Real):', Number(json.totalCmv).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('Margen Bruto:', Number(json.grossProfit).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), `(${json.grossMarginPercent}%)`);
    console.log('Gastos Operativos Totales:', Number(json.totalOperatingExpenses).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('  - Costos Fijos Estructura (Sueldos, Alquiler, Luz):', Number(json.fixedExpenses).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('  - Costos Variables Operativos (Insumos, Nafta, Packaging):', Number(json.variableExpenses).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('Margen Operativo (EBITDA):', Number(json.operatingProfit).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), `(${json.operatingMarginPercent}%)`);
    console.log('Resultado Neto (EBIT):', Number(json.netProfit).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), `(${json.netMarginPercent}%)`);
    console.log('Punto de Equilibrio (Monto a Facturar):', Number(json.weightedBreakEvenAmount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('Punto de Equilibrio (Unidades Físicas):', json.weightedBreakEvenUnits, 'unidades');
    console.log('Ticket Promedio por Pedido:', Number(json.averageTicket).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
    console.log('Gastos registrados en el desglose:', json.operatingExpensesBreakdown ? json.operatingExpensesBreakdown.length : 0);
    console.log('Órdenes despachadas en el desglose:', json.salesOrdersBreakdown ? json.salesOrdersBreakdown.length : 0);
    console.log('================================================================');
  });
});
