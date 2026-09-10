import { getDocumentProxy, extractTextItems, type StructuredTextItem } from "unpdf";
import { matchAnalyte } from "./analyte-dictionary";
import type { ExtractedRow, ParseResult, SampleType } from "./types";

const NON_DATA_PATTERNS = [
  /\d{1,2}\/\d{1,2}\/\d{2,4}/, // dates
  /page\s+\d+\s+of\s+\d+/i,
  /^[\d\s\-().]{7,}$/, // phone-number-only lines
  /@/, // emails
  /^https?:\/\//i
];

const UNIT_TOKEN = "%|ppm|meq\\/100g|meq\\/l|ds\\/m|mg\\/l|mg\\/kg|per\\s*250cc";
const VALUE_PATTERN = new RegExp(`([<>])?\\s*(\\d[\\d,]*\\.?\\d*)\\s*(${UNIT_TOKEN})?`, "i");
const RANGE_PATTERN = /(?:normal|range|reference|sufficien\w*)?\s*[:(]?\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*\)?/i;
const GENERIC_ROW_PATTERN = /^([A-Za-z][A-Za-z\-\s]{1,40}?)[:\s]+([<>]?\s*\d[\d,]*\.?\d*)\s*([%A-Za-z/]{0,15})?/;

function reconstructLines(items: StructuredTextItem[]): string[] {
  const lines: string[] = [];
  let current: { text: string; lastX: number; lastWidth: number; fontSize: number } | null = null;

  for (const item of items) {
    const str = item.str;
    if (current === null) {
      current = { text: str, lastX: item.x, lastWidth: item.width, fontSize: item.fontSize || 10 };
    } else {
      const gap = item.x - (current.lastX + current.lastWidth);
      const separator = gap > current.fontSize * 1.2 ? "   " : gap > 1 ? " " : "";
      current.text += separator + str;
      current.lastX = item.x;
      current.lastWidth = item.width;
    }
    if (item.hasEOL) {
      lines.push(current.text.replace(/\s+/g, " ").trim());
      current = null;
    }
  }
  if (current) lines.push(current.text.replace(/\s+/g, " ").trim());

  return lines.filter((l) => l.length > 0);
}

function isNonDataLine(line: string): boolean {
  if (line.length > 150) return true;
  if (!/\d/.test(line)) return true;
  return NON_DATA_PATTERNS.some((p) => p.test(line));
}

function extractRange(remainder: string): string | null {
  const match = remainder.match(RANGE_PATTERN);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

export async function parsePdfLabReport(buffer: ArrayBuffer, sampleType: SampleType): Promise<ParseResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { items } = await extractTextItems(pdf);

  const rows: ExtractedRow[] = [];
  const warnings: string[] = [];

  for (const pageItems of items) {
    const lines = reconstructLines(pageItems);

    for (const line of lines) {
      if (isNonDataLine(line)) continue;

      const dictMatch = matchAnalyte(sampleType, line);
      if (dictMatch) {
        const valueMatch = line.match(VALUE_PATTERN);
        if (!valueMatch) continue;
        const qualifier = valueMatch[1] || null;
        const value = Number(valueMatch[2].replace(/,/g, ""));
        const unit = valueMatch[3] || null;
        const remainder = line.slice((valueMatch.index || 0) + valueMatch[0].length);
        const labReferenceRange = extractRange(remainder);

        rows.push({
          analyte: dictMatch.canonical,
          value: Number.isFinite(value) ? value : null,
          textValue: Number.isFinite(value) ? null : line,
          unit,
          qualifier,
          labReferenceRange,
          confidence: dictMatch.confidence
        });
        continue;
      }

      const genericMatch = line.match(GENERIC_ROW_PATTERN);
      if (genericMatch) {
        const label = genericMatch[1].trim();
        if (label.length < 2) continue;
        const rawValue = genericMatch[2].trim();
        const qualifier = rawValue.match(/^[<>]/)?.[0] || null;
        const value = Number(rawValue.replace(/^[<>]\s*/, "").replace(/,/g, ""));
        const unit = genericMatch[3] || null;
        const remainder = line.slice((genericMatch.index || 0) + genericMatch[0].length);
        const labReferenceRange = extractRange(remainder);

        rows.push({
          analyte: label,
          value: Number.isFinite(value) ? value : null,
          textValue: Number.isFinite(value) ? null : line,
          unit,
          qualifier,
          labReferenceRange,
          confidence: "low"
        });
        warnings.push(`"${label}" wasn't recognized as a known analyte — included as-is, please check it.`);
      }
    }
  }

  if (rows.length === 0) {
    warnings.push("No analyte rows could be identified in this PDF — you may need to enter results manually, or the report's layout needs the parser tuned to it.");
  }

  return { rows, warnings };
}
