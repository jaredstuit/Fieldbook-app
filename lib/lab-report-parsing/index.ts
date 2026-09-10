import { parsePdfLabReport } from "./pdf";
import { parseExcelLabReport } from "./excel";
import type { ParseResult, SampleType } from "./types";

export type { ExtractedRow, ParseResult, SampleType } from "./types";

export async function parseLabReportFile(file: { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> }, sampleType: SampleType): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return parsePdfLabReport(buffer, sampleType);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv") || file.type.includes("sheet") || file.type === "text/csv") {
    return parseExcelLabReport(buffer, sampleType);
  }
  throw new Error("Unsupported file type. Upload a PDF, Excel (.xlsx/.xls), or CSV file.");
}
