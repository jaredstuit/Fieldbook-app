import Link from "next/link";
import { fmtDateTime } from "@/lib/field";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export default async function FieldNotesSection({ supabase, fieldId }: { supabase: SupabaseClient; fieldId: string }) {
  const [nr, or] = await Promise.all([
    supabase.from("field_notes").select("id,observed_at,note,tags").eq("field_id", fieldId).order("observed_at", { ascending: false }),
    supabase.from("observations").select("id,observed_at,observation_type,note,rating").eq("field_id", fieldId).order("observed_at", { ascending: false })
  ]);

  return (
    <div className="grid grid-2">
      <section className="card">
        <div className="section-head">
          <h2>Field notes</h2>
          <Link className="btn secondary small" href={`/fields/${fieldId}/notes/new`}>+ Note</Link>
        </div>
        {nr.data?.length ? (
          <div className="record-list">
            {nr.data.map((n: any) => (
              <article key={n.id}>
                <time>{fmtDateTime(n.observed_at)}</time>
                <p>{n.note}</p>
                <div className="record-actions"><Link className="text-link" href={`/fields/${fieldId}/notes/${n.id}/edit`}>Edit</Link></div>
              </article>
            ))}
          </div>
        ) : (
          <p className="subtle">No notes yet.</p>
        )}
      </section>
      <section className="card">
        <div className="section-head">
          <h2>Observations</h2>
          <Link className="btn secondary small" href={`/fields/${fieldId}/observations/new`}>+ Observation</Link>
        </div>
        {or.data?.length ? (
          <div className="record-list">
            {or.data.map((o: any) => (
              <article key={o.id}>
                <time>{fmtDateTime(o.observed_at)} · {o.observation_type || "Observation"}</time>
                <p>{o.note}</p>
                {o.rating != null ? <span className="pill">Rating {o.rating}</span> : null}
                <div className="record-actions"><Link className="text-link" href={`/fields/${fieldId}/observations/${o.id}/edit`}>Edit</Link></div>
              </article>
            ))}
          </div>
        ) : (
          <p className="subtle">No observations yet.</p>
        )}
      </section>
    </div>
  );
}
