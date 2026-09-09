import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import FieldBoundaryMap from "@/components/FieldBoundaryMap";
import { demoField as f } from "@/lib/demo-data";
import { getCurrentOrganization } from "@/lib/org";

type TimelineItem={id:string;date:string;type:string;title:string;detail:string;tags?:string[]};

function fmtDate(value:string){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}

export default async function FieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (demo) {
    return <AppShell active="Fields"><div className="topbar"><div><div className="subtle" style={{fontSize:13}}>{f.grower} / {f.ranch}</div><h1 style={{marginTop:4}}>{f.name}</h1><p className="subtle">{f.acres} acres · {f.variety} {f.crop} · planted {f.plantingYear}</p></div></div>
      <div className="pills">{f.flags.map(x=><span key={x} className="pill warn">{x}</span>)}</div><div className="tabs">{["Overview","Timeline","Samples","Notes","Map"].map((x,i)=><span key={x} className={"tab "+(i===0?"active":"")}>{x}</span>)}</div>
      <div className="grid grid-2"><section className="card"><h3>Field overview</h3><div className="kv"><div><div className="label">Crop</div><div className="value">{f.variety} {f.crop}</div></div><div><div className="label">Rootstock</div><div className="value">{f.rootstock}</div></div><div><div className="label">Planting year</div><div className="value">{f.plantingYear}</div></div><div><div className="label">Irrigation</div><div className="value">{f.irrigation}</div></div><div><div className="label">Water source</div><div className="value">{f.waterSource}</div></div><div><div className="label">Acres</div><div className="value">{f.acres}</div></div></div></section><section className="card"><h3>Field boundary & soils</h3><FieldBoundaryMap fieldId="field-1" initialAcres={f.acres}/></section></div>
    </AppShell>;
  }

  const { supabase } = await getCurrentOrganization();
  const { data: field } = await supabase.from("fields").select("id,name,acres,current_crop,variety,rootstock,planting_year,irrigation_type,notes,ranch_id,ranches(id,name,grower_id,growers(id,name)),water_sources(id,name)").eq("id",id).maybeSingle();
  if (!field) notFound();

  const [boundaryRes,soilsRes,notesRes,obsRes,samplesRes,recsRes,appsRes]=await Promise.all([
    supabase.rpc("get_field_boundary_geojson", { p_field_id:id }),
    supabase.from("field_soils").select("mukey,musym,muname,acres,percent_of_field").eq("field_id",id).order("acres",{ascending:false}),
    supabase.from("field_notes").select("id,observed_at,note,tags").eq("field_id",id).order("observed_at",{ascending:false}).limit(50),
    supabase.from("observations").select("id,observed_at,observation_type,note,rating").eq("field_id",id).order("observed_at",{ascending:false}).limit(50),
    supabase.from("samples").select("id,sample_type,sampled_at,lab_name,sample_label,notes,sample_results(id,analyte,value,text_value,unit,qualifier)").eq("field_id",id).order("sampled_at",{ascending:false}).limit(50),
    supabase.from("recommendations").select("id,recommended_at,recommendation_type,target_issue,notes").eq("field_id",id).order("recommended_at",{ascending:false}).limit(30),
    supabase.from("applications").select("id,applied_at,acres_treated,total_cost,notes,application_items(product_name,rate,rate_unit)").eq("field_id",id).order("applied_at",{ascending:false}).limit(30)
  ]);

  const boundary=boundaryRes.data;
  const initialSoils=(soilsRes.data||[]).map((s:any)=>({mukey:s.mukey,symbol:s.musym||"",name:s.muname||"",acres:Number(s.acres)||0,percent:Number(s.percent_of_field)||0}));
  const notes=notesRes.data||[];
  const observations=obsRes.data||[];
  const samples=samplesRes.data||[];

  const timeline:TimelineItem[]=[
    ...notes.map((n:any)=>({id:`note-${n.id}`,date:n.observed_at,type:"Note",title:"Field note",detail:n.note,tags:n.tags||[]})),
    ...observations.map((o:any)=>({id:`obs-${o.id}`,date:o.observed_at,type:"Observation",title:o.observation_type||"Field observation",detail:o.note+(o.rating!==null&&o.rating!==undefined?` · Rating ${o.rating}`:"")})),
    ...samples.map((s:any)=>({id:`sample-${s.id}`,date:`${s.sampled_at}T12:00:00`,type:"Sample",title:`${String(s.sample_type).charAt(0).toUpperCase()+String(s.sample_type).slice(1)} sample${s.lab_name?` · ${s.lab_name}`:""}`,detail:(s.sample_results||[]).slice(0,5).map((r:any)=>`${r.analyte}: ${r.value??r.text_value??"—"}${r.unit?` ${r.unit}`:""}`).join(" · ") || s.notes || "Sample record added"})),
    ...(recsRes.data||[]).map((r:any)=>({id:`rec-${r.id}`,date:`${r.recommended_at}T12:00:00`,type:"Recommendation",title:r.target_issue||r.recommendation_type||"Recommendation",detail:r.notes||"Recommendation added"})),
    ...(appsRes.data||[]).map((a:any)=>({id:`app-${a.id}`,date:`${a.applied_at}T12:00:00`,type:"Application",title:(a.application_items||[]).map((x:any)=>x.product_name).join(" + ")||"Application",detail:[a.acres_treated?`${a.acres_treated} acres`:null,a.total_cost?`$${Number(a.total_cost).toFixed(2)} total`:null,a.notes].filter(Boolean).join(" · ")}))
  ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());

  const ranchRaw = field.ranches as any;
  const ranch = Array.isArray(ranchRaw) ? ranchRaw[0] : ranchRaw;
  const growerRaw = ranch?.growers;
  const grower = Array.isArray(growerRaw) ? growerRaw[0] : growerRaw;
  const waterRaw = field.water_sources as any;
  const water = Array.isArray(waterRaw) ? waterRaw[0] : waterRaw;

  return <AppShell active="Fields">
    <div className="topbar"><div><div className="subtle" style={{fontSize:13}}><Link href={`/growers/${grower?.id}`}>{grower?.name || "Grower"}</Link> / {ranch?.name || "Ranch"}</div><h1 style={{marginTop:4}}>{field.name}</h1><p className="subtle">{field.acres?`${Number(field.acres).toFixed(2)} acres · `:""}{[field.variety,field.current_crop].filter(Boolean).join(" ") || "Crop not entered"}{field.planting_year?` · planted ${field.planting_year}`:""}</p></div>
      <div className="quick-actions"><Link className="btn secondary" href={`/fields/${id}/notes/new`}>+ Note</Link><Link className="btn secondary" href={`/fields/${id}/observations/new`}>+ Observation</Link><Link className="btn" href={`/fields/${id}/samples/new`}>+ Sample</Link></div></div>

    <div className="tabs"><a className="tab active" href="#overview">Overview</a><a className="tab" href="#timeline">Timeline <span className="tab-count">{timeline.length}</span></a><a className="tab" href="#samples">Samples <span className="tab-count">{samples.length}</span></a><a className="tab" href="#notes">Notes <span className="tab-count">{notes.length+observations.length}</span></a><a className="tab" href="#map">Map & soils</a></div>

    <div className="grid grid-2" id="overview">
      <section className="card"><h3>Field overview</h3><div className="kv"><div><div className="label">Crop</div><div className="value">{[field.variety,field.current_crop].filter(Boolean).join(" ") || "—"}</div></div><div><div className="label">Rootstock</div><div className="value">{field.rootstock || "—"}</div></div><div><div className="label">Planting year</div><div className="value">{field.planting_year || "—"}</div></div><div><div className="label">Irrigation</div><div className="value">{field.irrigation_type || "—"}</div></div><div><div className="label">Water source</div><div className="value">{water?.name || "—"}</div></div><div><div className="label">Acres</div><div className="value">{field.acres?Number(field.acres).toFixed(2):"—"}</div></div></div>{field.notes?<p className="subtle" style={{marginTop:18,marginBottom:0}}>{field.notes}</p>:null}</section>
      <section className="card snapshot"><h3>Record snapshot</h3><div className="snapshot-grid"><div><strong>{notes.length}</strong><span>Field notes</span></div><div><strong>{observations.length}</strong><span>Observations</span></div><div><strong>{samples.length}</strong><span>Samples</span></div><div><strong>{initialSoils.length}</strong><span>USDA soils</span></div></div></section>
    </div>

    <section className="card full-section" id="timeline"><div className="section-head"><div><h2>Field timeline</h2><p className="subtle">One chronological history of what happened in this field.</p></div><div className="quick-actions"><Link className="btn secondary small" href={`/fields/${id}/notes/new`}>Add note</Link><Link className="btn secondary small" href={`/fields/${id}/observations/new`}>Add observation</Link></div></div>
      {timeline.length?<div className="timeline">{timeline.slice(0,30).map(item=><div className="event" key={item.id}><time>{fmtDate(item.date)} · {item.type}</time><div className="event-title">{item.title}</div><div className="event-detail">{item.detail}</div>{item.tags?.length?<div className="pills compact">{item.tags.map(t=><span className="pill" key={t}>{t}</span>)}</div>:null}</div>)}</div>:<div className="empty compact-empty"><h3>No field history yet</h3><p className="subtle">Start with a note, observation, or sample.</p></div>}
    </section>

    <section className="card full-section" id="samples"><div className="section-head"><div><h2>Samples</h2><p className="subtle">Tissue, soil, water, and nematode results stay attached to this field.</p></div><Link className="btn" href={`/fields/${id}/samples/new`}>+ Add sample</Link></div>
      {samples.length?<div className="sample-list">{samples.map((s:any)=><article className="sample-card" key={s.id}><div className="sample-card-head"><div><span className="pill">{s.sample_type}</span><strong>{fmtDate(`${s.sampled_at}T12:00:00`)}</strong></div><span className="subtle">{s.lab_name||"Lab not entered"}</span></div>{s.sample_label?<div className="sample-label">{s.sample_label}</div>:null}{s.sample_results?.length?<table className="table compact-table"><thead><tr><th>Analyte</th><th>Result</th><th>Qualifier</th></tr></thead><tbody>{s.sample_results.map((r:any)=><tr key={r.id}><td>{r.analyte}</td><td><strong>{r.value??r.text_value??"—"}</strong>{r.unit?` ${r.unit}`:""}</td><td>{r.qualifier||"—"}</td></tr>)}</tbody></table>:<p className="subtle">No analyte results entered.</p>}{s.notes?<p className="sample-note">{s.notes}</p>:null}</article>)}</div>:<p className="subtle">No samples entered yet.</p>}
    </section>

    <div className="grid grid-2 full-section" id="notes">
      <section className="card"><div className="section-head"><div><h2>Field notes</h2><p className="subtle">General scouting notes and grower information.</p></div><Link className="btn secondary small" href={`/fields/${id}/notes/new`}>+ Note</Link></div>{notes.length?<div className="record-list">{notes.map((n:any)=><article key={n.id}><time>{fmtDate(n.observed_at)}</time><p>{n.note}</p>{n.tags?.length?<div className="pills compact">{n.tags.map((t:string)=><span className="pill" key={t}>{t}</span>)}</div>:null}</article>)}</div>:<p className="subtle">No notes yet.</p>}</section>
      <section className="card"><div className="section-head"><div><h2>Observations</h2><p className="subtle">Agronomic conditions and responses worth evaluating later.</p></div><Link className="btn secondary small" href={`/fields/${id}/observations/new`}>+ Observation</Link></div>{observations.length?<div className="record-list">{observations.map((o:any)=><article key={o.id}><time>{fmtDate(o.observed_at)} · {o.observation_type||"Observation"}</time><p>{o.note}</p>{o.rating!==null&&o.rating!==undefined?<span className="pill">Rating {o.rating}</span>:null}</article>)}</div>:<p className="subtle">No observations yet.</p>}</section>
    </div>

    <div className="grid grid-2 full-section" id="map">
      <section className="card"><h2>Field boundary & USDA soils</h2><FieldBoundaryMap fieldId={id} initialBoundary={boundary} initialAcres={field.acres?Number(field.acres):null} initialSoils={initialSoils}/></section>
      <section className="card"><h2>Soil summary</h2>{initialSoils.length?<table className="table"><thead><tr><th>Map unit</th><th>Acres</th><th>% field</th></tr></thead><tbody>{initialSoils.map(s=><tr key={s.mukey}><td><strong>{s.name}</strong>{s.symbol?<div className="subtle" style={{fontSize:12}}>{s.symbol}</div>:null}</td><td>{s.acres.toFixed(2)}</td><td><strong>{s.percent.toFixed(1)}%</strong></td></tr>)}</tbody></table>:<p className="subtle">Draw the boundary and choose “Get USDA soils” to build this field's permanent soil map.</p>}</section>
    </div>
  </AppShell>;
}
