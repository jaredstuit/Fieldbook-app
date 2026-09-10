import Link from "next/link";
import { fmtDate } from "@/lib/field";
import { getSignedSourceDocumentUrl } from "@/lib/storage";
import { getStatus } from "@/lib/reference-ranges";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function StatusPill({ status, rangeLabel }: { status: "low" | "optimal" | "high" | "unknown"; rangeLabel: string | null }) {
  if (status === "unknown") return null;
  const icon = status === "low" ? <ArrowDown size={12} /> : status === "high" ? <ArrowUp size={12} /> : <Check size={12} />;
  const label = status === "low" ? "Low" : status === "high" ? "High" : "Optimal";
  return (
    <span className={`pill status-${status} status-icon`} title={rangeLabel ? `Reference: ${rangeLabel}` : undefined}>
      {icon} {label}
    </span>
  );
}

export default async function FieldSamplesSection({ supabase, fieldId }: { supabase: SupabaseClient; fieldId: string }) {
  const { data: samples } = await supabase
    .from("samples")
    .select("id,sample_type,sampled_at,lab_name,sample_label,notes,source_document_path,sample_results(id,analyte,value,text_value,unit,qualifier,lab_reference_range)")
    .eq("field_id", fieldId)
    .order("sampled_at", { ascending: false });

  const samplesWithLinks = await Promise.all(
    (samples || []).map(async (s: any) => ({
      ...s,
      reportUrl: s.source_document_path ? await getSignedSourceDocumentUrl(supabase, s.source_document_path) : null
    }))
  );

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Samples</h2>
          <p className="subtle">Tissue, soil, water, and nematode history.</p>
        </div>
        <Link className="btn" href={`/fields/${fieldId}/samples/new`}>+ Add sample</Link>
      </div>
      {samplesWithLinks.length ? (
        <div className="sample-list">
          {samplesWithLinks.map((s: any) => (
            <article className="sample-card" key={s.id}>
              <div className="sample-card-head">
                <div>
                  <span className="pill">{s.sample_type}</span> <strong>{fmtDate(s.sampled_at + "T12:00:00-07:00")}</strong>
                </div>
                <div>
                  <span className="subtle">{s.lab_name || "Lab not entered"}</span>{" "}
                  {s.reportUrl ? (
                    <a className="text-link" href={s.reportUrl} target="_blank" rel="noopener noreferrer">
                      View report
                    </a>
                  ) : null}{" "}
                  <Link className="text-link" href={`/fields/${fieldId}/samples/${s.id}/edit`}>Edit</Link>
                </div>
              </div>
              {s.sample_label ? <div className="sample-label">{s.sample_label}</div> : null}
              {s.sample_results?.length ? (
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th>Analyte</th>
                      <th>Result</th>
                      <th>Qualifier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.sample_results.map((r: any) => {
                      const { status, rangeLabel } = getStatus({
                        sampleType: s.sample_type,
                        analyte: r.analyte,
                        value: r.value,
                        unit: r.unit,
                        labReferenceRange: r.lab_reference_range
                      });
                      return (
                        <tr key={r.id}>
                          <td>{r.analyte}</td>
                          <td>
                            <strong>{r.value ?? r.text_value ?? "—"}</strong>
                            {r.unit ? ` ${r.unit}` : ""}
                          </td>
                          <td>{r.qualifier || "—"}</td>
                          <td>
                            {s.sample_type === "nematode" ? (
                              r.lab_reference_range ? <span className="result-range">{r.lab_reference_range}</span> : "—"
                            ) : (
                              <StatusPill status={status} rangeLabel={rangeLabel} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="subtle">No analyte results entered.</p>
              )}
              {s.notes ? <p>{s.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="subtle">No samples yet.</p>
      )}
    </section>
  );
}
