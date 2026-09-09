import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getCurrentOrganization } from "@/lib/org";

export default async function SamplesPage() {
  const {supabase,organization}=await getCurrentOrganization();
  if(!organization) return <AppShell active="Samples"><div className="card">No organization membership found.</div></AppShell>;
  const {data}=await supabase.from("samples").select("id,sample_type,sampled_at,lab_name,sample_label,fields(id,name,ranches(name,growers(name))),sample_results(id)").eq("organization_id",organization.id).order("sampled_at",{ascending:false}).limit(100);
  const rows=data||[];
  return <AppShell active="Samples"><div className="topbar"><div><h1>Samples</h1><p className="subtle">Recent tissue, soil, water, and nematode records.</p></div></div>
    <div className="card">{rows.length?<table className="table"><thead><tr><th>Date</th><th>Type</th><th>Grower / field</th><th>Lab</th><th>Results</th></tr></thead><tbody>{rows.map((s:any)=>{const f=Array.isArray(s.fields)?s.fields[0]:s.fields;const r=Array.isArray(f?.ranches)?f.ranches[0]:f?.ranches;const g=Array.isArray(r?.growers)?r.growers[0]:r?.growers;return <tr key={s.id}><td>{new Date(`${s.sampled_at}T12:00:00`).toLocaleDateString()}</td><td><span className="pill">{s.sample_type}</span></td><td>{f?<Link href={`/fields/${f.id}`}><strong>{g?.name?`${g.name} · `:""}{f.name}</strong></Link>:"—"}</td><td>{s.lab_name||"—"}</td><td>{s.sample_results?.length||0}</td></tr>})}</tbody></table>:<p className="subtle">No samples have been entered yet.</p>}</div>
  </AppShell>;
}
