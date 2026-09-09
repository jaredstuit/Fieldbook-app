import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function polygonToWkt(geometry: any) {
  if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) throw new Error("A GeoJSON Polygon is required.");
  const rings = geometry.coordinates.map((ring:number[][])=>{
    if (!Array.isArray(ring) || ring.length < 4) throw new Error("Invalid polygon ring.");
    const pts=[...ring], a=pts[0], b=pts[pts.length-1];
    if (a[0]!==b[0] || a[1]!==b[1]) pts.push(a);
    return `(${pts.map(([lng,lat])=>`${Number(lng).toFixed(7)} ${Number(lat).toFixed(7)}`).join(",")})`;
  });
  return `POLYGON(${rings.join(",")})`;
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const { id } = await params;
    const { geometry } = await req.json();
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) return NextResponse.json({error:"Unauthorized"},{status:401});

    const { data: field } = await supabase.from("fields").select("id,organization_id").eq("id",id).maybeSingle();
    if (!field) return NextResponse.json({error:"Field not found."},{status:404});

    const wkt=polygonToWkt(geometry);
    if (wkt.length>60000) return NextResponse.json({error:"Field boundary is too complex; simplify the polygon first."},{status:400});
    const safeWkt=wkt.replaceAll("'","''");
    const query=`
~DeclareGeometry(@aoi)~
select @aoi = geometry::STPolyFromText('${safeWkt}', 4326)
~DeclareIdGeomTable(@intersectedPolygonGeometries)~
~GetClippedMapunits(@aoi,polygon,geo,@intersectedPolygonGeometries)~
~DeclareIdGeogTable(@intersectedPolygonGeographies)~
~GetGeogFromGeomWgs84(@intersectedPolygonGeometries,@intersectedPolygonGeographies)~
select id, sum(geog.STArea()) * 0.000247105381 as acres into #aggarea from @intersectedPolygonGeographies group by id;
select cast(M.mukey as varchar(30)) as mukey, M.musym, M.muname, A.acres from #aggarea A join mapunit M on A.id = M.mukey order by A.acres desc;`;

    const upstream=await fetch("https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({query,format:"JSON+COLUMNNAME"}),cache:"no-store"});
    if(!upstream.ok) throw new Error(`USDA Soil Data Access returned ${upstream.status}.`);
    const payload=await upstream.json(); const table=payload.Table||[];
    if(!table.length) return NextResponse.json({soils:[]});
    const header=table[0].map((x:string)=>String(x).toLowerCase()); const ix=(n:string)=>header.indexOf(n);
    const rows=table.slice(1).map((r:any[])=>({mukey:String(r[ix("mukey")]),symbol:String(r[ix("musym")]),name:String(r[ix("muname")]),acres:Number(r[ix("acres")])||0}));
    const total=rows.reduce((s:number,x:any)=>s+x.acres,0); const soils=rows.map((x:any)=>({...x,percent:total?x.acres/total*100:0}));

    await supabase.from("field_soils").delete().eq("field_id",id);
    if(soils.length){ const { error }=await supabase.from("field_soils").insert(soils.map((s:any)=>({organization_id:field.organization_id,field_id:id,mukey:s.mukey,musym:s.symbol,muname:s.name,acres:s.acres,percent_of_field:s.percent,retrieved_at:new Date().toISOString()}))); if(error) throw error; }
    return NextResponse.json({soils,mappedAcres:total,source:"USDA NRCS Soil Data Access / SSURGO"});
  } catch(e:any){ return NextResponse.json({error:e?.message||"Soil lookup failed."},{status:400}); }
}
