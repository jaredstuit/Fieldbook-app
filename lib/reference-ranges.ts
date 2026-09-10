export type SampleType = "tissue" | "soil" | "water" | "nematode";
export type Status = "low" | "optimal" | "high" | "unknown";

export type ReferenceRange = {
  analyte: string;
  sampleType: Exclude<SampleType, "nematode">;
  aliases: string[];
  unit: string;
  crop?: string | null;
  low: number | null;
  high: number | null;
  source?: string;
};

// General guideline ranges only — not crop-specific. Real sufficiency ranges
// vary by crop, growth stage, and region; these are meant as a rough starting
// point when a lab doesn't print its own reference range, not a substitute
// for agronomist judgment. See the lab report import follow-up: expand/refine
// these against real reports from the labs actually used.
const GENERIC = "General guideline — not crop-specific";

export const REFERENCE_RANGES: ReferenceRange[] = [
  // Tissue (% dry weight for macros, ppm for micros)
  { analyte: "Nitrogen", sampleType: "tissue", aliases: ["n", "nitrogen", "total n"], unit: "%", low: 2.5, high: 4.0, source: GENERIC },
  { analyte: "Phosphorus", sampleType: "tissue", aliases: ["p", "phosphorus"], unit: "%", low: 0.2, high: 0.5, source: GENERIC },
  { analyte: "Potassium", sampleType: "tissue", aliases: ["k", "potassium"], unit: "%", low: 1.5, high: 3.0, source: GENERIC },
  { analyte: "Calcium", sampleType: "tissue", aliases: ["ca", "calcium"], unit: "%", low: 1.0, high: 3.0, source: GENERIC },
  { analyte: "Magnesium", sampleType: "tissue", aliases: ["mg", "magnesium"], unit: "%", low: 0.3, high: 1.0, source: GENERIC },
  { analyte: "Sulfur", sampleType: "tissue", aliases: ["s", "sulfur", "sulphur"], unit: "%", low: 0.2, high: 0.5, source: GENERIC },
  { analyte: "Sodium", sampleType: "tissue", aliases: ["na", "sodium"], unit: "%", low: 0, high: 0.25, source: GENERIC },
  { analyte: "Chloride", sampleType: "tissue", aliases: ["cl", "chloride", "chlorine"], unit: "%", low: 0, high: 0.5, source: GENERIC },
  { analyte: "Boron", sampleType: "tissue", aliases: ["b", "boron"], unit: "ppm", low: 25, high: 100, source: GENERIC },
  { analyte: "Zinc", sampleType: "tissue", aliases: ["zn", "zinc"], unit: "ppm", low: 20, high: 50, source: GENERIC },
  { analyte: "Manganese", sampleType: "tissue", aliases: ["mn", "manganese"], unit: "ppm", low: 20, high: 300, source: GENERIC },
  { analyte: "Iron", sampleType: "tissue", aliases: ["fe", "iron"], unit: "ppm", low: 50, high: 300, source: GENERIC },
  { analyte: "Copper", sampleType: "tissue", aliases: ["cu", "copper"], unit: "ppm", low: 5, high: 20, source: GENERIC },

  // Soil (0-12in, common lab units)
  { analyte: "pH", sampleType: "soil", aliases: ["ph", "soil ph"], unit: "", low: 6.0, high: 7.5, source: GENERIC },
  { analyte: "Organic Matter", sampleType: "soil", aliases: ["om", "organic matter", "organic matter %"], unit: "%", low: 2.0, high: 5.0, source: GENERIC },
  { analyte: "CEC", sampleType: "soil", aliases: ["cec", "cation exchange capacity"], unit: "meq/100g", low: 10, high: 25, source: GENERIC },
  { analyte: "Nitrate-N", sampleType: "soil", aliases: ["no3-n", "nitrate-n", "nitrate n", "no3"], unit: "ppm", low: 10, high: 30, source: GENERIC },
  { analyte: "Phosphorus", sampleType: "soil", aliases: ["p", "phosphorus", "olsen p", "bray p"], unit: "ppm", low: 15, high: 40, source: GENERIC },
  { analyte: "Potassium", sampleType: "soil", aliases: ["k", "potassium", "exchangeable k"], unit: "ppm", low: 150, high: 300, source: GENERIC },
  { analyte: "Calcium", sampleType: "soil", aliases: ["ca", "calcium"], unit: "ppm", low: 1500, high: 4000, source: GENERIC },
  { analyte: "Magnesium", sampleType: "soil", aliases: ["mg", "magnesium"], unit: "ppm", low: 150, high: 500, source: GENERIC },
  { analyte: "Sodium", sampleType: "soil", aliases: ["na", "sodium"], unit: "ppm", low: 0, high: 150, source: GENERIC },
  { analyte: "SAR", sampleType: "soil", aliases: ["sar", "sodium adsorption ratio"], unit: "", low: 0, high: 6, source: GENERIC },
  { analyte: "EC", sampleType: "soil", aliases: ["ec", "electrical conductivity"], unit: "dS/m", low: 0, high: 2, source: GENERIC },
  { analyte: "Boron", sampleType: "soil", aliases: ["b", "boron"], unit: "ppm", low: 0.5, high: 2.0, source: GENERIC },
  { analyte: "Zinc", sampleType: "soil", aliases: ["zn", "zinc"], unit: "ppm", low: 1.0, high: 5.0, source: GENERIC },
  { analyte: "Manganese", sampleType: "soil", aliases: ["mn", "manganese"], unit: "ppm", low: 5, high: 50, source: GENERIC },
  { analyte: "Iron", sampleType: "soil", aliases: ["fe", "iron"], unit: "ppm", low: 5, high: 50, source: GENERIC },
  { analyte: "Copper", sampleType: "soil", aliases: ["cu", "copper"], unit: "ppm", low: 0.5, high: 5.0, source: GENERIC },

  // Irrigation water (general ag water quality guidelines)
  { analyte: "pH", sampleType: "water", aliases: ["ph", "water ph"], unit: "", low: 6.5, high: 8.4, source: GENERIC },
  { analyte: "EC", sampleType: "water", aliases: ["ec", "electrical conductivity"], unit: "dS/m", low: 0, high: 0.75, source: GENERIC },
  { analyte: "SAR", sampleType: "water", aliases: ["sar", "sodium adsorption ratio"], unit: "", low: 0, high: 6, source: GENERIC },
  { analyte: "Chloride", sampleType: "water", aliases: ["cl", "chloride"], unit: "ppm", low: 0, high: 140, source: GENERIC },
  { analyte: "Sodium", sampleType: "water", aliases: ["na", "sodium"], unit: "ppm", low: 0, high: 69, source: GENERIC },
  { analyte: "Bicarbonate", sampleType: "water", aliases: ["hco3", "bicarbonate"], unit: "ppm", low: 0, high: 90, source: GENERIC },
  { analyte: "Boron", sampleType: "water", aliases: ["b", "boron"], unit: "ppm", low: 0, high: 0.7, source: GENERIC },
  { analyte: "Nitrate-N", sampleType: "water", aliases: ["no3-n", "nitrate-n", "nitrate n", "no3"], unit: "ppm", low: 0, high: 5, source: GENERIC },
  { analyte: "TDS", sampleType: "water", aliases: ["tds", "total dissolved solids"], unit: "ppm", low: 0, high: 450, source: GENERIC }
];

export function normalizeAnalyteName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9%\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findReferenceRange(
  sampleType: SampleType,
  analyte: string,
  opts?: { crop?: string | null }
): ReferenceRange | null {
  if (sampleType === "nematode") return null;
  const needle = normalizeAnalyteName(analyte);
  if (!needle) return null;
  const candidates = REFERENCE_RANGES.filter((r) => r.sampleType === sampleType);
  const crop = opts?.crop ? opts.crop.toLowerCase() : null;

  const matches = candidates.filter(
    (r) => normalizeAnalyteName(r.analyte) === needle || r.aliases.some((a) => normalizeAnalyteName(a) === needle)
  );
  if (matches.length === 0) return null;
  if (crop) {
    const cropMatch = matches.find((r) => r.crop && r.crop.toLowerCase() === crop);
    if (cropMatch) return cropMatch;
  }
  return matches.find((r) => !r.crop) || matches[0];
}

export function classifyValue(value: number | null, range: ReferenceRange | null): Status {
  if (value === null || !Number.isFinite(value) || !range) return "unknown";
  if (range.low !== null && value < range.low) return "low";
  if (range.high !== null && value > range.high) return "high";
  return "optimal";
}

const RANGE_PATTERN = /^\s*([\d.]+)\s*[-–]\s*([\d.]+)\s*$/;
const LESS_THAN_PATTERN = /^\s*<\s*([\d.]+)\s*$/;
const GREATER_THAN_PATTERN = /^\s*>\s*([\d.]+)\s*$/;

export function classifyFromLabRange(value: number | null, labReferenceRange: string | null): Status | null {
  if (value === null || !Number.isFinite(value) || !labReferenceRange) return null;
  const trimmed = labReferenceRange.trim();

  const rangeMatch = trimmed.match(RANGE_PATTERN);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    if (Number.isFinite(low) && Number.isFinite(high)) {
      if (value < low) return "low";
      if (value > high) return "high";
      return "optimal";
    }
  }

  const lessThan = trimmed.match(LESS_THAN_PATTERN);
  if (lessThan) {
    const high = Number(lessThan[1]);
    if (Number.isFinite(high)) return value > high ? "high" : "optimal";
  }

  const greaterThan = trimmed.match(GREATER_THAN_PATTERN);
  if (greaterThan) {
    const low = Number(greaterThan[1]);
    if (Number.isFinite(low)) return value < low ? "low" : "optimal";
  }

  return null;
}

export function getStatus(input: {
  sampleType: SampleType;
  analyte: string;
  value: number | null;
  unit?: string | null;
  labReferenceRange?: string | null;
  crop?: string | null;
}): { status: Status; rangeLabel: string | null; source: "lab" | "reference-table" | "none" } {
  if (input.sampleType === "nematode") {
    return { status: "unknown", rangeLabel: input.labReferenceRange || null, source: "none" };
  }

  const labStatus = classifyFromLabRange(input.value, input.labReferenceRange ?? null);
  if (labStatus) {
    return { status: labStatus, rangeLabel: input.labReferenceRange || null, source: "lab" };
  }

  const range = findReferenceRange(input.sampleType, input.analyte, { crop: input.crop });
  if (range) {
    const status = classifyValue(input.value, range);
    const rangeLabel = range.low !== null && range.high !== null ? `${range.low}–${range.high} ${range.unit}`.trim() : null;
    return { status, rangeLabel, source: "reference-table" };
  }

  return { status: "unknown", rangeLabel: null, source: "none" };
}
