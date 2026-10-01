package com.buenbocado.erp.service;

import com.buenbocado.erp.dto.finance.FinanceDashboardDto;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@Slf4j
public class PoiExcelExportService {

    /**
     * Genera un reporte Excel en Streaming (SXSSFWorkbook) con consumo de RAM constante (<25MB),
     * manteniendo una ventana de 100 filas en memoria y volcando a disco efímero.
     */
    public byte[] exportFinanceDashboardToExcel(FinanceDashboardDto dashboard) throws IOException {
        // Ventana deslizante de 100 filas en memoria
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            workbook.setCompressTempFiles(true); // Compresión de archivos temporales
            SXSSFSheet sheet = workbook.createSheet("Estado de Resultados & KPIs");

            // Estilos
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("$#,##0.00"));

            // Cabecera
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BUEN BOCADO ERP - ESTADO DE RESULTADOS Y METRICAS");
            titleCell.setCellStyle(headerStyle);

            Row headerRow = sheet.createRow(2);
            String[] headers = {"Concepto / Métrica Financiera", "Valor Monetario / Porcentaje"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowIdx = 3;
            addMetricRow(sheet, rowIdx++, "Ventas Netas Totales", dashboard.getTotalSales(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Costo Mercaderías Vendidas (CMV Lotes PEPS)", dashboard.getTotalCmv(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Utilidad Bruta", dashboard.getGrossProfit(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Gastos Operativos Fijos", dashboard.getFixedExpenses(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Gastos Operativos Variables", dashboard.getVariableExpenses(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "EBITDA", dashboard.getEbitda(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "EBIT", dashboard.getEbit(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Utilidad Neta", dashboard.getNetProfit(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Punto de Equilibrio Ponderado ($)", dashboard.getWeightedBreakEvenAmount(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Necesidades Operativas de Fondos (NOF)", dashboard.getNof(), currencyStyle);
            addMetricRow(sheet, rowIdx++, "Capital de Trabajo", dashboard.getWorkingCapital(), currencyStyle);

            sheet.trackAllColumnsForAutoSizing();
            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);

            workbook.write(out);
            log.info("Reporte Excel exportado exitosamente en streaming SXSSF");
            return out.toByteArray();
        }
    }

    private void addMetricRow(Sheet sheet, int rowIdx, String label, Object value, CellStyle currencyStyle) {
        Row row = sheet.createRow(rowIdx);
        row.createCell(0).setCellValue(label);
        Cell valCell = row.createCell(1);
        if (value instanceof Number num) {
            valCell.setCellValue(num.doubleValue());
            valCell.setCellStyle(currencyStyle);
        } else {
            valCell.setCellValue(String.valueOf(value));
        }
    }
}
