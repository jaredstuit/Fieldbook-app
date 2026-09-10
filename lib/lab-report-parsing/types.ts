import type { SampleType } from "@/lib/reference-ranges";

export type { SampleType };

export type ExtractedRow = {
  analyte: string;
  value: number | null;
  textValue: string | null;
  unit: string | null;
  qualifier: string | null;
  labReferenceRange: string | null;
  confidence: "high" | "low";
};

export type ParseResult = {
  rows: ExtractedRow[];
  warnings: string[];
};
