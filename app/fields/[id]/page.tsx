export const dynamic='force-dynamic';
export const revalidate=0;
import AppShell from "@/components/AppShell";
import FieldHeader from "@/components/FieldHeader";
import FieldTimelineSection from "@/components/FieldTimelineSection";
import FieldSamplesSection from "@/components/FieldSamplesSection";
import FieldNotesSection from "@/components/FieldNotesSection";
import FieldMapSection from "@/components/FieldMapSection";
import { getFieldContext } from "@/lib/field";

export default async function FieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, field, ranch, grower, water } = await getFieldContext(id);
  const [n, o, s, soil] = await Promise.all([
    countRows(supabase, "field_notes", id),
    countRows(supabase, "observations", id),
    countRows(supabase, "samples", id),
    countRows(supabase, "field_soils", id)
  ]);

  return (
    <AppShell active="Fields">
      <FieldHeader field={field} ranch={ranch} grower={grower} active="overview" />

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <section className="card">
          <div className="section-head"><h2>Field overview</h2></div>
          <div className="kv">
            <div><div className="label">Crop</div><div className="value">{[field.variety, field.current_crop].filter(Boolean).join(" ") || "—"}</div></div>
            <div><div className="label">Rootstock</div><div className="value">{field.rootstock || "—"}</div></div>
            <div><div className="label">Planting year</div><div className="value">{field.planting_year || "—"}</div></div>
            <div><div className="label">Irrigation</div><div className="value">{field.irrigation_type || "—"}</div></div>
            <div><div className="label">Water source</div><div className="value">{water?.name || "—"}</div></div>
            <div><div className="label">Acres</div><div className="value">{field.acres ? Number(field.acres).toFixed(2) : "—"}</div></div>
          </div>
          {field.notes ? <p className="subtle" style={{ marginTop: 18 }}>{field.notes}</p> : null}
        </section>
        <section className="card snapshot">
          <h2>Record snapshot</h2>
          <div className="snapshot-grid">
            <div><strong>{n}</strong><span>Field notes</span></div>
            <div><strong>{o}</strong><span>Observations</span></div>
            <div><strong>{s}</strong><span>Samples</span></div>
            <div><strong>{soil}</strong><span>USDA soils</span></div>
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <FieldTimelineSection supabase={supabase} fieldId={id} />
        <FieldSamplesSection supabase={supabase} fieldId={id} />
        <FieldNotesSection supabase={supabase} fieldId={id} />
        <FieldMapSection supabase={supabase} fieldId={id} initialAcres={field.acres ? Number(field.acres) : null} />
      </div>
    </AppShell>
  );
}

async function countRows(supabase: any, table: string, fieldId: string) {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("field_id", fieldId);
  return count || 0;
}
