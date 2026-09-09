import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getCurrentOrganization } from "@/lib/org";

export default async function FieldsPage() {
  const {supabase,organization}=await getCurrentOrganization();
  if(!organization) return <AppShell active="Fields"><div className="card">No organization membership found.</div></AppShell>;
  const {data}=await supabase.from("fields").select("id,name,acres,current_crop,variety,ranches(name,growers(id,name))").eq("organization_id",organization.id).order("name");
  const rows=data||[];
  return <AppShell active="Fields"><div className="topbar"><div><h1>Fields</h1><p className="subtle">All mapped and unmapped blocks in {organization.name}.</p></div></div>
    <div className="card">{rows.length?<table className="table"><thead><tr><th>Field</th><th>Grower</th><th>Ranch</th><th>Crop</th><th>Acres</th></tr></thead><tbody>{rows.map((f:any)=>{const r=Array.isArray(f.ranches)?f.ranches[0]:f.ranches;const g=Array.isArray(r?.growers)?r.growers[0]:r?.growers;return <tr key={f.id}><td><Link href={`/fields/${f.id}`}><strong>{f.name}</strong></Link></td><td>{g?.name||"—"}</td><td>{r?.name||"—"}</td><td>{[f.variety,f.current_crop].filter(Boolean).join(" ")||"—"}</td><td>{f.acres?Number(f.acres).toFixed(2):"—"}</td></tr>})}</tbody></table>:<p className="subtle">No fields yet.</p>}</div>
  </AppShell>;
}
