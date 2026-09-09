import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
