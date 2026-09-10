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

const UNIT_TOKEN_PATTERN = /^(%|ppm|ds\/m|meq\/100g|meq\/l|mg\/l|mg\/kg|-|—)?$/i;

// Some lab reports (e.g. bar-chart style summaries) lay results out as a
// table with analytes across the top as column headers, and separate rows
// underneath for units, test results, and a normal-range low/high pair --
// rather than one "analyte: value" line per analyte. Detect that shape
// directly: a header row where every token is a recognized analyte alias,
// optionally followed by a units row, then 1-3 rows of matching-length
// numeric data (test results, then range low/high).
function parseTransposedTable(lines: string[], sampleType: SampleType): ExtractedRow[] | null {
  for (let i = 0; i < lines.length; i++) {
    const headerTokens = lines[i].split(/\s+/).filter(Boolean);
    if (headerTokens.length < 3) continue;

    const matches = headerTokens.map((t) => matchAnalyte(sampleType, t));
    if (matches.some((m) => !m || m.confidence !== "high")) continue;
    const canonicals = matches.map((m) => m!.canonical);
    if (new Set(canonicals).size !== canonicals.length) continue; // header must be distinct analytes, not a data row

    const width = headerTokens.length;
    let unitTokens: string[] | null = null;
    const numericRows: number[][] = [];

    for (let j = i + 1; j < Math.min(lines.length, i + 16) && numericRows.length < 3; j++) {
      const tokens = lines[j].split(/\s+/).filter(Boolean);
      if (tokens.length !== width) continue;

      if (!unitTokens && tokens.every((t) => UNIT_TOKEN_PATTERN.test(t))) {
        unitTokens = tokens;
        continue;
      }

      const numbers = tokens.map((t) => Number(t.replace(/,/g, "")));
      if (numbers.every((n) => Number.isFinite(n))) {
        numericRows.push(numbers);
      }
    }

    if (numericRows.length === 0) continue;

    const results = numericRows[0];
    const rangeLow = numericRows[1];
    const rangeHigh = numericRows[2];

    return canonicals.map((canonical, idx) => ({
      analyte: canonical,
      value: results[idx],
      textValue: null,
      unit: unitTokens?.[idx] || null,
      qualifier: null,
      labReferenceRange: rangeLow && rangeHigh ? `${rangeLow[idx]}-${rangeHigh[idx]}` : null,
      confidence: "high" as const
    }));
  }

  return null;
}

export async function parsePdfLabReport(buffer: ArrayBuffer, sampleType: SampleType): Promise<ParseResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { items } = await extractTextItems(pdf);

  const rows: ExtractedRow[] = [];
  const warnings: string[] = [];

  for (const pageItems of items) {
    const lines = reconstructLines(pageItems);

    const transposed = parseTransposedTable(lines, sampleType);
    if (transposed) {
      rows.push(...transposed);
      continue;
    }

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
