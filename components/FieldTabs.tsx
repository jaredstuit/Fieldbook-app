import Link from "next/link";
export default function FieldTabs({id,active}:{id:string;active:string}){
 const tabs=[['overview','Overview',`/fields/${id}`],['timeline','Timeline',`/fields/${id}/timeline`],['samples','Samples',`/fields/${id}/samples`],['notes','Notes & observations',`/fields/${id}/notes`],['map','Map & soils',`/fields/${id}/map`]];
 return <nav className="tabs">{tabs.map(([key,label,href])=><Link key={key} className={`tab ${active===key?'active':''}`} href={href}>{label}</Link>)}</nav>
}
