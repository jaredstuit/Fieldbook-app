import FieldBoundaryMap from "@/components/FieldBoundaryMap";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export default async function FieldMapSection({ supabase, fieldId, initialAcres }: { supabase: SupabaseClient; fieldId: string; initialAcres: number | null }) {
  const [br, sr] = await Promise.all([
    supabase.rpc("get_field_boundary_geojson", { p_field_id: fieldId }),
    supabase.from("field_soils").select("mukey,musym,muname,acres,percent_of_field,geometry").eq("field_id", fieldId).order("acres", { ascending: false })
  ]);
  let boundary: any = br.data;
  if (typeof boundary === "string") {
    try { boundary = JSON.parse(boundary); } catch { boundary = null; }
  }
  if (boundary?.type === "MultiPolygon" && boundary.coordinates?.length) {
    boundary = { type: "Polygon", coordinates: boundary.coordinates[0] };
  }
  const soils = (sr.data || []).map((s: any) => ({
    mukey: s.mukey,
    symbol: s.musym || "",
    name: s.muname || "",
    acres: Number(s.acres) || 0,
    percent: Number(s.percent_of_field) || 0,
    geometry: s.geometry || null
  }));

  return (
    <section className="card">
      <h2>Field boundary & USDA soils</h2>
      <p className="subtle">Your saved boundary remains on this map each time you return.</p>
      <FieldBoundaryMap fieldId={fieldId} initialBoundary={boundary} initialAcres={initialAcres} initialSoils={soils} />
    </section>
  );
}
