import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import SortableTable from "@/components/SortableTable";
import { getCurrentOrganization } from "@/lib/org";

export default async function GrowerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getCurrentOrganization();
  const { data: grower } = await supabase.from("growers").select("id,name,contact_name,phone,email,notes").eq("id", id).maybeSingle();
  if (!grower) notFound();
  const { data: ranches } = await supabase.from("ranches").select("id,name,notes,fields(id,name,acres,current_crop,variety)").eq("grower_id", id).order("name");
  const allFields = (ranches || []).flatMap((r:any) => r.fields || []);
  const totalAcres = allFields.reduce((s:number,f:any)=>s+(Number(f.acres)||0),0);

  return <AppShell><div className="topbar"><div><div className="subtle" style={{fontSize:13}}>Grower</div><h1>{grower.name}</h1><p className="subtle">{allFields.length} fields · {totalAcres.toFixed(1)} acres</p></div><div className="quick-actions"><Link className="btn secondary" href={`/growers/${id}/edit`}>Edit grower</Link><Link className="btn" href={`/growers/${id}/ranches/new`}>+ Ranch</Link></div></div>
    <div className="grid grid-3" style={{marginBottom:18}}>
      <div className="card stat"><strong>{ranches?.length || 0}</strong><span>Ranches</span></div>
      <div className="card stat"><strong>{allFields.length}</strong><span>Fields</span></div>
      <div className="card stat"><strong>{totalAcres.toFixed(1)}</strong><span>Total acres</span></div>
    </div>
    {(ranches || []).map((r:any)=><section className="card" key={r.id} style={{marginBottom:16}}><div className="section-head"><div><h3>{r.name}</h3>{r.notes?<p className="subtle">{r.notes}</p>:null}</div><div className="quick-actions"><Link className="text-link" href={`/ranches/${r.id}/edit`}>Edit ranch</Link><Link className="btn secondary" href={`/ranches/${r.id}/fields/new`}>+ Field</Link></div></div>
      {r.fields?.length ? <SortableTable
        rows={r.fields}
        rowKey={(f:any)=>f.id}
        defaultSortKey="name"
        columns={[
          { key:"name", label:"Field", accessor:(f:any)=>f.name, render:(f:any)=><Link href={`/fields/${f.id}`}><strong>{f.name}</strong></Link> },
          { key:"crop", label:"Crop", accessor:(f:any)=>[f.variety,f.current_crop].filter(Boolean).join(" ")||null, render:(f:any)=>[f.variety,f.current_crop].filter(Boolean).join(" ")||"—" },
          { key:"acres", label:"Acres", accessor:(f:any)=>f.acres?Number(f.acres):null, render:(f:any)=>f.acres??"—" }
        ]}
      /> : <p className="subtle">No fields yet.</p>}
    </section>)}
  </AppShell>;
}
