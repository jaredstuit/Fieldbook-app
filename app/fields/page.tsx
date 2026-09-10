import Link from "next/link";
import AppShell from "@/components/AppShell";
import SortableTable from "@/components/SortableTable";
import { getCurrentOrganization } from "@/lib/org";

export default async function FieldsPage() {
  const {supabase,organization}=await getCurrentOrganization();
  if(!organization) return <AppShell active="Fields"><div className="card">No organization membership found.</div></AppShell>;
  const {data}=await supabase.from("fields").select("id,name,acres,current_crop,variety,ranches(name,growers(id,name))").eq("organization_id",organization.id).order("name");
  const rows=(data||[]).map((f:any)=>{
    const r=Array.isArray(f.ranches)?f.ranches[0]:f.ranches;
    const g=Array.isArray(r?.growers)?r.growers[0]:r?.growers;
    return { ...f, growerName:g?.name||null, ranchName:r?.name||null, cropLabel:[f.variety,f.current_crop].filter(Boolean).join(" ")||null };
  });
  return <AppShell active="Fields"><div className="topbar"><div><h1>Fields</h1><p className="subtle">All mapped and unmapped blocks in {organization.name}.</p></div></div>
    <div className="card">{rows.length?<SortableTable
      rows={rows}
      rowKey={(f:any)=>f.id}
      defaultSortKey="name"
      columns={[
        { key:"name", label:"Field", accessor:(f:any)=>f.name, render:(f:any)=><Link href={`/fields/${f.id}`}><strong>{f.name}</strong></Link> },
        { key:"growerName", label:"Grower", accessor:(f:any)=>f.growerName, render:(f:any)=>f.growerName||"—" },
        { key:"ranchName", label:"Ranch", accessor:(f:any)=>f.ranchName, render:(f:any)=>f.ranchName||"—" },
        { key:"cropLabel", label:"Crop", accessor:(f:any)=>f.cropLabel, render:(f:any)=>f.cropLabel||"—" },
        { key:"acres", label:"Acres", accessor:(f:any)=>f.acres?Number(f.acres):null, render:(f:any)=>f.acres?Number(f.acres).toFixed(2):"—" }
      ]}
    />:<p className="subtle">No fields yet.</p>}</div>
  </AppShell>;
}
