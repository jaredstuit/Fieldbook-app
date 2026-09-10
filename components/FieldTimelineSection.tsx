import { fmtDate, fmtDateTime } from "@/lib/field";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export default async function FieldTimelineSection({ supabase, fieldId }: { supabase: SupabaseClient; fieldId: string }) {
  const [nr, or, sr, rr, ar] = await Promise.all([
    supabase.from("field_notes").select("id,observed_at,note,tags").eq("field_id", fieldId).order("observed_at", { ascending: false }),
    supabase.from("observations").select("id,observed_at,observation_type,note,rating").eq("field_id", fieldId).order("observed_at", { ascending: false }),
    supabase.from("samples").select("id,sample_type,sampled_at,lab_name,sample_label").eq("field_id", fieldId).order("sampled_at", { ascending: false }),
    supabase.from("recommendations").select("id,recommended_at,recommendation_type,target_issue,notes").eq("field_id", fieldId).order("recommended_at", { ascending: false }),
    supabase.from("applications").select("id,applied_at,acres_treated,total_cost,notes,application_items(product_name)").eq("field_id", fieldId).order("applied_at", { ascending: false })
  ]);

  const items: any[] = [
    ...(nr.data || []).map((x: any) => ({ id: "n" + x.id, date: x.observed_at, type: "Note", title: "Field note", detail: x.note, time: true })),
    ...(or.data || []).map((x: any) => ({ id: "o" + x.id, date: x.observed_at, type: "Observation", title: x.observation_type || "Observation", detail: x.note, time: true })),
    ...(sr.data || []).map((x: any) => ({ id: "s" + x.id, date: x.sampled_at + "T12:00:00-07:00", type: "Sample", title: `${x.sample_type} sample`, detail: [x.sample_label, x.lab_name].filter(Boolean).join(" · ") })),
    ...(rr.data || []).map((x: any) => ({ id: "r" + x.id, date: x.recommended_at + "T12:00:00-07:00", type: "Recommendation", title: x.target_issue || x.recommendation_type || "Recommendation", detail: x.notes || "" })),
    ...(ar.data || []).map((x: any) => ({ id: "a" + x.id, date: x.applied_at + "T12:00:00-07:00", type: "Application", title: (x.application_items || []).map((i: any) => i.product_name).join(" + ") || "Application", detail: x.notes || "" }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section className="card">
      <h2>Field timeline</h2>
      <p className="subtle">Complete chronological history for this field. Times are shown in Pacific Time.</p>
      {items.length ? (
        <div className="timeline">
          {items.map(x => (
            <div className="event" key={x.id}>
              <time>{x.time ? fmtDateTime(x.date) : fmtDate(x.date)} · {x.type}</time>
              <div className="event-title">{x.title}</div>
              <div className="event-detail">{x.detail}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="subtle">No field history yet.</p>
      )}
    </section>
  );
}
