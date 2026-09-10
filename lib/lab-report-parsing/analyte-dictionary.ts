import { normalizeAnalyteName } from "@/lib/reference-ranges";
import type { SampleType } from "./types";

export type AnalyteAlias = {
  canonical: string;
  unit: string | null;
  aliases: string[];
};

export const ANALYTE_DICTIONARY: Record<SampleType, AnalyteAlias[]> = {
  tissue: [
    { canonical: "Nitrogen", unit: "%", aliases: ["n", "nitrogen", "total n"] },
    { canonical: "Phosphorus", unit: "%", aliases: ["p", "phosphorus"] },
    { canonical: "Potassium", unit: "%", aliases: ["k", "potassium"] },
    { canonical: "Calcium", unit: "%", aliases: ["ca", "calcium"] },
    { canonical: "Magnesium", unit: "%", aliases: ["mg", "magnesium"] },
    { canonical: "Sulfur", unit: "%", aliases: ["s", "sulfur", "sulphur"] },
    { canonical: "Sodium", unit: "%", aliases: ["na", "sodium"] },
    { canonical: "Chloride", unit: "%", aliases: ["cl", "chloride", "chlorine"] },
    { canonical: "Boron", unit: "ppm", aliases: ["b", "boron"] },
    { canonical: "Zinc", unit: "ppm", aliases: ["zn", "zinc"] },
    { canonical: "Manganese", unit: "ppm", aliases: ["mn", "manganese"] },
    { canonical: "Iron", unit: "ppm", aliases: ["fe", "iron"] },
    { canonical: "Copper", unit: "ppm", aliases: ["cu", "copper"] },
    { canonical: "Molybdenum", unit: "ppm", aliases: ["mo", "molybdenum"] },
    { canonical: "Aluminum", unit: "ppm", aliases: ["al", "aluminum", "aluminium"] }
  ],
  soil: [
    { canonical: "pH", unit: "", aliases: ["ph", "soil ph"] },
    { canonical: "Organic Matter", unit: "%", aliases: ["om", "organic matter", "organic matter %"] },
    { canonical: "CEC", unit: "meq/100g", aliases: ["cec", "cation exchange capacity"] },
    { canonical: "Nitrate-N", unit: "ppm", aliases: ["no3-n", "nitrate-n", "nitrate n", "no3"] },
    { canonical: "Phosphorus", unit: "ppm", aliases: ["p", "phosphorus", "olsen p", "bray p"] },
    { canonical: "Potassium", unit: "ppm", aliases: ["k", "potassium", "exchangeable k"] },
    { canonical: "Calcium", unit: "ppm", aliases: ["ca", "calcium"] },
    { canonical: "Magnesium", unit: "ppm", aliases: ["mg", "magnesium"] },
    { canonical: "Sodium", unit: "ppm", aliases: ["na", "sodium"] },
    { canonical: "SAR", unit: "", aliases: ["sar", "sodium adsorption ratio"] },
    { canonical: "EC", unit: "dS/m", aliases: ["ec", "electrical conductivity"] },
    { canonical: "Boron", unit: "ppm", aliases: ["b", "boron"] },
    { canonical: "Zinc", unit: "ppm", aliases: ["zn", "zinc"] },
    { canonical: "Manganese", unit: "ppm", aliases: ["mn", "manganese"] },
    { canonical: "Iron", unit: "ppm", aliases: ["fe", "iron"] },
    { canonical: "Copper", unit: "ppm", aliases: ["cu", "copper"] },
    { canonical: "Base Saturation", unit: "%", aliases: ["base saturation", "bs"] }
  ],
  water: [
    { canonical: "pH", unit: "", aliases: ["ph", "water ph"] },
    { canonical: "EC", unit: "dS/m", aliases: ["ec", "electrical conductivity"] },
    { canonical: "SAR", unit: "", aliases: ["sar", "sodium adsorption ratio"] },
    { canonical: "Chloride", unit: "ppm", aliases: ["cl", "chloride"] },
    { canonical: "Sodium", unit: "ppm", aliases: ["na", "sodium"] },
    { canonical: "Bicarbonate", unit: "ppm", aliases: ["hco3", "bicarbonate"] },
    { canonical: "Carbonate", unit: "ppm", aliases: ["co3", "carbonate"] },
    { canonical: "Sulfate", unit: "ppm", aliases: ["so4", "sulfate", "sulphate"] },
    { canonical: "Boron", unit: "ppm", aliases: ["b", "boron"] },
    { canonical: "Nitrate-N", unit: "ppm", aliases: ["no3-n", "nitrate-n", "nitrate n", "no3"] },
    { canonical: "Calcium", unit: "ppm", aliases: ["ca", "calcium"] },
    { canonical: "Magnesium", unit: "ppm", aliases: ["mg", "magnesium"] },
    { canonical: "TDS", unit: "ppm", aliases: ["tds", "total dissolved solids"] },
    { canonical: "Hardness", unit: "ppm", aliases: ["hardness", "total hardness"] }
  ],
  nematode: [
    { canonical: "Root-knot", unit: "per 250cc soil", aliases: ["root-knot", "root knot", "meloidogyne"] },
    { canonical: "Root Lesion", unit: "per 250cc soil", aliases: ["root lesion", "lesion", "pratylenchus"] },
    { canonical: "Ring", unit: "per 250cc soil", aliases: ["ring", "criconemella", "criconemoides"] },
    { canonical: "Dagger", unit: "per 250cc soil", aliases: ["dagger", "xiphinema"] },
    { canonical: "Citrus", unit: "per 250cc soil", aliases: ["citrus nematode", "tylenchulus"] },
    { canonical: "Stubby-root", unit: "per 250cc soil", aliases: ["stubby-root", "stubby root", "paratrichodorus", "trichodorus"] },
    { canonical: "Pin", unit: "per 250cc soil", aliases: ["pin", "paratylenchus"] },
    { canonical: "Root-Knot Eggs", unit: "per gram root", aliases: ["root-knot eggs", "meloidogyne eggs", "egg count"] }
  ]
};

export function matchAnalyte(sampleType: SampleType, rawLabel: string): { canonical: string; confidence: "high" | "low" } | null {
  const needle = normalizeAnalyteName(rawLabel);
  if (!needle) return null;
  const dictionary = ANALYTE_DICTIONARY[sampleType];

  for (const entry of dictionary) {
    if (entry.aliases.some((a) => normalizeAnalyteName(a) === needle)) {
      return { canonical: entry.canonical, confidence: "high" };
    }
  }

  const words = needle.split(" ");
  for (const entry of dictionary) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeAnalyteName(alias);
      if (normalizedAlias.length < 3) continue; // skip short symbols like "n"/"p"/"k" for fuzzy word matching
      if (words.includes(normalizedAlias) || needle.includes(normalizedAlias)) {
        return { canonical: entry.canonical, confidence: "low" };
      }
    }
  }

  return null;
}
