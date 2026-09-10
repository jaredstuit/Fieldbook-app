"use client";

import { useRef, useState } from "react";
import { parseLabReport } from "@/app/actions";
import { ANALYTE_DICTIONARY } from "@/lib/lab-report-parsing/analyte-dictionary";
import type { SampleType } from "@/lib/lab-report-parsing/types";

type Row = { id: number; analyte: string; value: string; unit: string; qualifier: string; labReferenceRange: string };

type InitialRow = {
  analyte: string;
  value?: string | number | null;
  unit?: string | null;
  qualifier?: string | null;
  labReferenceRange?: string | null;
};

const SAMPLE_TYPES: SampleType[] = ["tissue", "soil", "water", "nematode"];

function emptyRow(id: number): Row {
  return { id, analyte: "", value: "", unit: "", qualifier: "", labReferenceRange: "" };
}

export default function SampleResultRows({ initialRows = [] }: { initialRows?: InitialRow[] }) {
  const [rows, setRows] = useState<Row[]>(
    initialRows.length
      ? initialRows.map((r, i) => ({
          id: i + 1,
          analyte: r.analyte || "",
          value: r.value == null ? "" : String(r.value),
          unit: r.unit || "",
          qualifier: r.qualifier || "",
          labReferenceRange: r.labReferenceRange || ""
        }))
      : [emptyRow(1), emptyRow(2), emptyRow(3)]
  );
  const [parseStatus, setParseStatus] = useState<"idle" | "parsing" | "error">("idle");
  const [parseError, setParseError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = (id: number, key: keyof Row, value: string) => setRows(rs => rs.map(r => (r.id === id ? { ...r, [key]: value } : r)));
  const add = () => setRows(rs => [...rs, emptyRow(Math.max(...rs.map(r => r.id), 0) + 1)]);
  const remove = (id: number) => setRows(rs => (rs.length === 1 ? rs : rs.filter(r => r.id !== id)));

  const currentSampleType = (): SampleType => {
    const select = fileInputRef.current?.form?.elements.namedItem("sample_type") as HTMLSelectElement | null;
    const value = select?.value as SampleType | undefined;
    return value && SAMPLE_TYPES.includes(value) ? value : "tissue";
  };

  const loadStarters = () => {
    const dictionary = ANALYTE_DICTIONARY[currentSampleType()];
    setRows(dictionary.map((entry, i) => ({ id: i + 1, analyte: entry.canonical, value: "", unit: entry.unit || "", qualifier: "", labReferenceRange: "" })));
  };

  const handleParse = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setParseStatus("error");
      setParseError("Choose a PDF or Excel file first.");
      return;
    }
    setParseStatus("parsing");
    setParseError(null);
    setWarnings([]);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("sample_type", currentSampleType());
      const result = await parseLabReport(fd);
      if (result.rows.length === 0) {
        setParseStatus("error");
        setParseError("No analyte results could be read from that file. Enter results manually below, or double-check the file.");
        setWarnings(result.warnings);
        return;
      }
      setRows(
        result.rows.map((r, i) => ({
          id: i + 1,
          analyte: r.analyte,
          value: r.value != null ? String(r.value) : r.textValue || "",
          unit: r.unit || "",
          qualifier: r.qualifier || "",
          labReferenceRange: r.labReferenceRange || ""
        }))
      );
      setWarnings(result.warnings);
      setParseStatus("idle");
    } catch (e: any) {
      setParseStatus("error");
      setParseError(e?.message || "Could not parse that file.");
    }
  };

  return (
    <div>
      <div className="section-head" style={{ marginBottom: 10 }}>
        <div>
          <h3 style={{ marginBottom: 3 }}>Sample results</h3>
          <p className="subtle" style={{ fontSize: 13, marginBottom: 0 }}>
            Enter only the analytes the lab reported, or upload the lab report to fill these in automatically. Add as many rows as needed.
          </p>
        </div>
        <button className="btn secondary small" type="button" onClick={loadStarters}>
          Load starter rows
        </button>
      </div>

      <div className="card" style={{ background: "#fafbf9", marginBottom: 14, padding: 12 }}>
        <label style={{ marginBottom: 6 }}>
          <span>Upload lab report (PDF or Excel)</span>
          <input ref={fileInputRef} type="file" name="source_file" accept=".pdf,.xlsx,.xls,.csv" />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary small" type="button" onClick={handleParse} disabled={parseStatus === "parsing"}>
            {parseStatus === "parsing" ? "Parsing…" : "Parse lab report"}
          </button>
          <span className="subtle" style={{ fontSize: 12 }}>Keep this file selected — it will be attached to the sample when you save.</span>
        </div>
        {parseError ? <p className="login-error" style={{ marginTop: 10 }}>{parseError}</p> : null}
        {warnings.length ? (
          <div style={{ marginTop: 10, fontSize: 13 }}>
            <strong>Please double-check:</strong>
            <ul style={{ margin: "4px 0 0 18px" }}>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="result-grid result-grid-head">
        <span>Analyte</span>
        <span>Value</span>
        <span>Unit</span>
        <span>Qualifier</span>
        <span>Reference range</span>
        <span></span>
      </div>
      {rows.map(row => (
        <div className="result-grid" key={row.id}>
          <input name="analyte" value={row.analyte} onChange={e => update(row.id, "analyte", e.target.value)} placeholder="Potassium" />
          <input name="result_value" value={row.value} onChange={e => update(row.id, "value", e.target.value)} inputMode="decimal" placeholder="1.34" />
          <input name="unit" value={row.unit} onChange={e => update(row.id, "unit", e.target.value)} placeholder="% / ppm" />
          <input name="qualifier" value={row.qualifier} onChange={e => update(row.id, "qualifier", e.target.value)} placeholder="Low / < / >" />
          <input
            name="lab_reference_range"
            value={row.labReferenceRange}
            onChange={e => update(row.id, "labReferenceRange", e.target.value)}
            placeholder="e.g. 2.0-3.0"
          />
          <button type="button" className="icon-btn" onClick={() => remove(row.id)} aria-label="Remove result row">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn secondary small" onClick={add} style={{ marginTop: 10 }}>
        + Add result row
      </button>
    </div>
  );
}
