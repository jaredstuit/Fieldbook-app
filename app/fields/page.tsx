import AppShell from "@/components/AppShell";
import FieldsTable from "@/components/FieldsTable";
import { getCurrentOrganization } from "@/lib/org";

export default async function FieldsPage() {
  const {supabase,organization}=await getCurrentOrganization();
  if(!organization) return <AppShell active="Fields"><div className="card">No organization membership found.</div></AppShell>;
  const {data}=await supabase.from("fields").select("id,name,acres,current_crop,variety,ranches(name,growers(id,name))").eq("organization_id",organization.id).order("name");
  const rows=(data||[]).map((f:any)=>{
    const r=Array.isArray(f.ranches)?f.ranches[0]:f.ranches;
    const g=Array.isArray(r?.growers)?r.growers[0]:r?.growers;
    return { ...f, growerName:g?.name||null, ranchName:r?.name||null, cropLabel:[f.variety,f.current_crop].filter(Boolean).join(" ")||null, acres:f.acres?Number(f.acres):null };
  });
  return <AppShell active="Fields"><div className="topbar"><div><h1>Fields</h1><p className="subtle">All mapped and unmapped blocks in {organization.name}.</p></div></div>
    <div className="card">{rows.length?<FieldsTable rows={rows}/>:<p className="subtle">No fields yet.</p>}</div>
  </AppShell>;
}
