import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getCurrentOrganization } from "@/lib/org";

export default async function GrowerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getCurrentOrganization();
  const { data: grower } = await supabase.from("growers").select("id,name,contact_name,phone,email,notes").eq("id", id).maybeSingle();
  if (!grower) notFound();
  const { data: ranches } = await supabase.from("ranches").select("id,name,notes,fields(id,name,acres,current_crop,variety)").eq("grower_id", id).order("name");
  const allFields = (ranches || []).flatMap((r:any) => r.fields || []);
  const totalAcres = allFields.reduce((s:number,f:any)=>s+(Number(f.acres)||0),0);

  return <AppShell><div className="topbar"><div><div className="subtle" style={{fontSize:13}}>Grower</div><h1>{grower.name}</h1><p className="subtle">{allFields.length} fields · {totalAcres.toFixed(1)} acres</p></div><Link className="btn" href={`/growers/${id}/ranches/new`}>+ Ranch</Link></div>
    <div className="grid grid-3" style={{marginBottom:18}}>
      <div className="card stat"><strong>{ranches?.length || 0}</strong><span>Ranches</span></div>
      <div className="card stat"><strong>{allFields.length}</strong><span>Fields</span></div>
      <div className="card stat"><strong>{totalAcres.toFixed(1)}</strong><span>Total acres</span></div>
    </div>
    {(ranches || []).map((r:any)=><section className="card" key={r.id} style={{marginBottom:16}}><div className="section-head"><div><h3>{r.name}</h3>{r.notes?<p className="subtle">{r.notes}</p>:null}</div><Link className="btn secondary" href={`/ranches/${r.id}/fields/new`}>+ Field</Link></div>
      {r.fields?.length ? <table className="table"><thead><tr><th>Field</th><th>Crop</th><th>Acres</th></tr></thead><tbody>{r.fields.map((f:any)=><tr key={f.id}><td><Link href={`/fields/${f.id}`}><strong>{f.name}</strong></Link></td><td>{[f.variety,f.current_crop].filter(Boolean).join(" ") || "—"}</td><td>{f.acres ?? "—"}</td></tr>)}</tbody></table> : <p className="subtle">No fields yet.</p>}
    </section>)}
  </AppShell>;
}
