import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeBoundary(value: any) {
  let boundary = value;
  if (typeof boundary === "string") {
    try { boundary = JSON.parse(boundary); } catch { return null; }
  }
  if (boundary?.type === "FeatureCollection") {
    boundary = boundary.features?.[0]?.geometry ?? null;
  } else if (boundary?.type === "Feature") {
    boundary = boundary.geometry ?? null;
  }
  if (boundary?.type === "MultiPolygon" && boundary.coordinates?.length) {
    boundary = { type: "Polygon", coordinates: boundary.coordinates[0] };
  }
  return boundary?.type === "Polygon" ? boundary : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.rpc("get_field_boundary_geojson", { p_field_id: id });
    if (error) throw error;
    return NextResponse.json({ geometry: normalizeBoundary(data) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Boundary load failed." }, { status: 400 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { geometry, acres } = await req.json();
    if (!geometry || geometry.type !== "Polygon") return NextResponse.json({error:"A GeoJSON Polygon is required."},{status:400});
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) return NextResponse.json({error:"Unauthorized"},{status:401});
    const { error } = await supabase.rpc("save_field_boundary", { p_field_id:id, p_geometry:geometry, p_acres:Number(acres) });
    if (error) throw error;
    return NextResponse.json({ok:true});
  } catch (e:any) { return NextResponse.json({error:e?.message || "Boundary save failed."},{status:400}); }
}
