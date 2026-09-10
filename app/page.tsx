import Link from "next/link";
import AppShell from "@/components/AppShell";
import SortableTable from "@/components/SortableTable";
import { getCurrentOrganization } from "@/lib/org";
import { growers as demoGrowers } from "@/lib/demo-data";

export default async function Home() {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (demo) {
    return <AppShell>
      <div className="topbar"><div><h1>Growers</h1><p className="subtle">Demo mode — connect Supabase to create live records.</p></div><Link className="btn" href="/growers/new">+ Grower</Link></div>
      <div className="grid grid-4" style={{marginBottom:18}}><div className="card stat"><strong>3</strong><span>Growers</span></div><div className="card stat"><strong>6</strong><span>Ranches</span></div><div className="card stat"><strong>23</strong><span>Fields</span></div><div className="card stat"><strong>903.8</strong><span>Total acres</span></div></div>
      <div className="card"><table className="table"><thead><tr><th>Grower</th><th>Ranches</th><th>Fields</th><th>Acres</th><th>Last visit</th></tr></thead><tbody>{demoGrowers.map((g,i)=><tr key={g.id}><td><strong>{i===0?<Link href="/fields/field-1">{g.name}</Link>:g.name}</strong></td><td>{g.ranches}</td><td>{g.fields}</td><td>{g.acres}</td><td>{g.lastVisit}</td></tr>)}</tbody></table></div>
    </AppShell>;
  }

  const { supabase, organization } = await getCurrentOrganization();
  if (!organization) {
    return <AppShell><div className="card"><h2>Account connected</h2><p>Your login works, but this user has not been added to an organization yet. Run the included <code>bootstrap_owner.sql</code> once in Supabase, then refresh this page.</p></div></AppShell>;
  }

  const { data: growers } = await supabase.from("growers").select("id,name,ranches(id,fields(id,acres))").eq("organization_id", organization.id).order("name");
  const rows = (growers || []).map((g:any)=>{
    const ranches = g.ranches || [];
    const fields = ranches.flatMap((r:any)=>r.fields || []);
    return { ...g, ranchCount:ranches.length, fieldCount:fields.length, acres:fields.reduce((s:number,f:any)=>s+(Number(f.acres)||0),0) };
  });
  const totalFields = rows.reduce((s:number,g:any)=>s+g.fieldCount,0);
  const totalRanches = rows.reduce((s:number,g:any)=>s+g.ranchCount,0);
  const totalAcres = rows.reduce((s:number,g:any)=>s+g.acres,0);

  return <AppShell><div className="topbar"><div><h1>Growers</h1><p className="subtle">{organization.name} · live database</p></div><Link className="btn" href="/growers/new">+ Grower</Link></div>
    <div className="grid grid-4" style={{marginBottom:18}}><div className="card stat"><strong>{rows.length}</strong><span>Growers</span></div><div className="card stat"><strong>{totalRanches}</strong><span>Ranches</span></div><div className="card stat"><strong>{totalFields}</strong><span>Fields</span></div><div className="card stat"><strong>{totalAcres.toFixed(1)}</strong><span>Total acres</span></div></div>
    <div className="card">{rows.length?<SortableTable
      rows={rows}
      rowKey={(g:any)=>g.id}
      defaultSortKey="name"
      columns={[
        { key:"name", label:"Grower", accessor:(g:any)=>g.name, render:(g:any)=><Link href={`/growers/${g.id}`}><strong>{g.name}</strong></Link> },
        { key:"ranchCount", label:"Ranches", accessor:(g:any)=>g.ranchCount },
        { key:"fieldCount", label:"Fields", accessor:(g:any)=>g.fieldCount },
        { key:"acres", label:"Acres", accessor:(g:any)=>g.acres, render:(g:any)=>g.acres.toFixed(1) }
      ]}
    />:<div className="empty"><h3>No growers yet</h3><p className="subtle">Create your first grower, then add ranches and fields beneath it.</p><Link className="btn" href="/growers/new">Create first grower</Link></div>}</div>
  </AppShell>;
}
