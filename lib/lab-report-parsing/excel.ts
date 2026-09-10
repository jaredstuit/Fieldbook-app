import * as XLSX from "xlsx";
import { matchAnalyte } from "./analyte-dictionary";
import type { ExtractedRow, ParseResult, SampleType } from "./types";

const LABEL_HEADER = /analyte|parameter|element|test|constituent/i;
const VALUE_HEADER = /result|value|amount/i;
const UNIT_HEADER = /unit/i;
const RANGE_HEADER = /range|normal|reference|sufficien/i;
const QUALIFIER_PATTERN = /^[<>]/;

function findHeaderRow(rows: any[][]): { rowIndex: number; labelCol: number; valueCol: number; unitCol: number | null; rangeCol: number | null } | null {
  const scanLimit = Math.min(rows.length, 10);
  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i] || [];
    let labelCol = -1;
    let valueCol = -1;
    let unitCol: number | null = null;
    let rangeCol: number | null = null;
    row.forEach((cell, idx) => {
      const text = String(cell ?? "").trim();
      if (!text) return;
      if (labelCol === -1 && LABEL_HEADER.test(text)) labelCol = idx;
      else if (valueCol === -1 && VALUE_HEADER.test(text)) valueCol = idx;
      else if (unitCol === null && UNIT_HEADER.test(text)) unitCol = idx;
      else if (rangeCol === null && RANGE_HEADER.test(text)) rangeCol = idx;
    });
    if (labelCol !== -1 && valueCol !== -1) {
      return { rowIndex: i, labelCol, valueCol, unitCol, rangeCol };
    }
  }
  return null;
}

function parseValueCell(raw: any): { value: number | null; textValue: string | null; qualifier: string | null } {
  const text = String(raw ?? "").trim();
  if (!text) return { value: null, textValue: null, qualifier: null };
  const qualifierMatch = text.match(QUALIFIER_PATTERN);
  const qualifier = qualifierMatch ? qualifierMatch[0] : null;
  const numeric = Number(text.replace(/^[<>]\s*/, "").replace(/,/g, ""));
  if (Number.isFinite(numeric) && text.replace(/^[<>]\s*/, "").match(/^[\d.]+$/)) {
    return { value: numeric, textValue: null, qualifier };
  }
  return { value: null, textValue: text, qualifier: null };
}

export async function parseExcelLabReport(buffer: ArrayBuffer, sampleType: SampleType): Promise<ParseResult> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const rows: ExtractedRow[] = [];
  const warnings: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const grid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!grid.length) continue;

    const header = findHeaderRow(grid);
    if (!header) {
      warnings.push(`Sheet "${sheetName}": couldn't find an analyte/result header row — skipped.`);
      continue;
    }

    for (let r = header.rowIndex + 1; r < grid.length; r++) {
      const row = grid[r] || [];
      const label = String(row[header.labelCol] ?? "").trim();
      if (!label) continue;

      const { value, textValue, qualifier } = parseValueCell(row[header.valueCol]);
      if (value === null && !textValue) continue;

      const unit = header.unitCol !== null ? String(row[header.unitCol] ?? "").trim() || null : null;
      const labReferenceRange = header.rangeCol !== null ? String(row[header.rangeCol] ?? "").trim() || null : null;
      const match = matchAnalyte(sampleType, label);

      rows.push({
        analyte: match?.canonical ?? label,
        value,
        textValue,
        unit,
        qualifier,
        labReferenceRange,
        confidence: match?.confidence ?? "low"
      });

      if (!match) {
        warnings.push(`Sheet "${sheetName}", row ${r + 1}: "${label}" wasn't recognized as a known analyte — included as-is, please check it.`);
      }
    }
  }

  if (rows.length === 0 && warnings.length === 0) {
    warnings.push("No analyte rows were found in this file.");
  }

  return { rows, warnings };
}
