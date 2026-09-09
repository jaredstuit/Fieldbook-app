import { notFound } from "next/navigation";
import { getCurrentOrganization } from "@/lib/org";

export async function getFieldContext(id:string){
  const { supabase } = await getCurrentOrganization();
  const { data: field } = await supabase.from("fields").select("id,name,acres,current_crop,variety,rootstock,planting_year,irrigation_type,water_source_id,notes,ranch_id,ranches(id,name,grower_id,growers(id,name)),water_sources(id,name)").eq("id",id).maybeSingle();
  if(!field) notFound();
  const ranchRaw:any=field.ranches; const ranch=Array.isArray(ranchRaw)?ranchRaw[0]:ranchRaw;
  const growerRaw:any=ranch?.growers; const grower=Array.isArray(growerRaw)?growerRaw[0]:growerRaw;
  const waterRaw:any=field.water_sources; const water=Array.isArray(waterRaw)?waterRaw[0]:waterRaw;
  return {supabase,field,ranch,grower,water};
}

export function fmtDate(value:string){
  const d=new Date(value); if(Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",year:"numeric"}).format(d);
}
export function fmtDateTime(value:string){
  const d=new Date(value); if(Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(d);
}
export function pacificInputValue(value?:string){
 const d=value?new Date(value):new Date();
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const get=(t:string)=>parts.find(p=>p.type===t)?.value||'';
 return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
