import Link from "next/link";
import FieldTabs from "@/components/FieldTabs";
export default function FieldHeader({field,ranch,grower,active}:{field:any;ranch:any;grower:any;active:string}){
 return <><div className="topbar"><div><div className="subtle" style={{fontSize:13}}><Link href={`/growers/${grower?.id}`}>{grower?.name||'Grower'}</Link> / {ranch?.name||'Ranch'}</div><h1 style={{marginTop:4}}>{field.name}</h1><p className="subtle">{field.acres?`${Number(field.acres).toFixed(2)} acres · `:''}{[field.variety,field.current_crop].filter(Boolean).join(' ')||'Crop not entered'}{field.planting_year?` · planted ${field.planting_year}`:''}</p></div><div className="quick-actions"><Link className="btn secondary" href={`/fields/${field.id}/edit`}>Edit field</Link><Link className="btn secondary" href={`/fields/${field.id}/notes/new`}>+ Note</Link><Link className="btn" href={`/fields/${field.id}/samples/new`}>+ Sample</Link></div></div><FieldTabs id={field.id} active={active}/></>
}
