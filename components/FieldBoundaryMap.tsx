"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import area from "@turf/area";

type Soil = { mukey: string; symbol: string; name: string; acres: number; percent: number };
type Props = {
  fieldId: string;
  initialBoundary?: any | null;
  initialAcres?: number | null;
  initialSoils?: Soil[];
};

function addBoundary(draw: MapboxDraw, geometry: any) {
  if (!geometry || geometry.type !== "Polygon") return false;
  draw.deleteAll();
  draw.add({ type: "Feature", properties: {}, geometry });
  return true;
}

function boundsFromGeometry(geometry: any): mapboxgl.LngLatBounds | null {
  try {
    const bounds = new mapboxgl.LngLatBounds();
    const coords = geometry?.coordinates?.flat(2) || [];
    coords.forEach((p: any) => Array.isArray(p) && p.length >= 2 && bounds.extend([p[0], p[1]]));
    return bounds.isEmpty() ? null : bounds;
  } catch {
    return null;
  }
}

function fitToBoundary(m: mapboxgl.Map, geometry: any) {
  const bounds = boundsFromGeometry(geometry);
  if (bounds) { m.resize(); m.fitBounds(bounds, { padding: 55, maxZoom: 16 }); }
}

export default function FieldBoundaryMap({ fieldId, initialBoundary = null, initialAcres = null, initialSoils = [] }: Props) {
  const node = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [acres, setAcres] = useState<number | null>(initialAcres);
  const [polygon, setPolygon] = useState<any>(initialBoundary);
  const [soils, setSoils] = useState<Soil[]>(initialSoils);
  const [status, setStatus] = useState("");
  const [dirty, setDirty] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!node.current || !token || map.current) return;
    mapboxgl.accessToken = token;
    const initialBounds = initialBoundary && initialBoundary.type === "Polygon" ? boundsFromGeometry(initialBoundary) : null;
    const m = new mapboxgl.Map({
      container: node.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      ...(initialBounds
        ? { bounds: initialBounds, fitBoundsOptions: { padding: 55, maxZoom: 16 } }
        : { center: [-121.124, 37.741], zoom: 11 })
    });
    map.current = m;
    m.addControl(new mapboxgl.NavigationControl(), "top-left");
    const draw = new MapboxDraw({ displayControlsDefault: false, controls: { polygon: true, trash: true } });
    m.addControl(draw, "top-right");

    const persist = async (geometry: any, calculatedAcres: number) => {
      try {
        const res = await fetch(`/api/fields/${fieldId}/boundary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geometry, acres: calculatedAcres })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not save boundary.");
        setDirty(false);
        setStatus("Boundary saved.");
      } catch (e: any) {
        setStatus(e?.message || "Could not save boundary.");
      }
    };

    const update = () => {
      const fc = draw.getAll();
      const feature = fc.features[0] as any;
      if (!feature) { setPolygon(null); setAcres(null); setSoils([]); setDirty(true); return; }
      const calculatedAcres = area(feature as any) * 0.000247105381;
      setPolygon(feature.geometry);
      setAcres(calculatedAcres);
      setDirty(true);
      setStatus("Saving boundary…");
      void persist(feature.geometry, calculatedAcres);
    };

    m.on("draw.create", update);
    m.on("draw.update", update);
    m.on("draw.delete", update);

    m.on("load", async () => {
      // First render the server-provided boundary, if present.
      if (initialBoundary && addBoundary(draw, initialBoundary)) {
        setPolygon(initialBoundary);
        fitToBoundary(m, initialBoundary);
      }

      // Then explicitly reload the saved geometry from Supabase through the API.
      // This avoids RSC/GeoJSON serialization differences and always reflects the database.
      try {
        const res = await fetch(`/api/fields/${fieldId}/boundary`, { cache: "no-store" });
        const json = await res.json();
        if (map.current !== m) return;
        if (!res.ok) throw new Error(json.error || "Could not load saved boundary.");
        if (json.geometry && addBoundary(draw, json.geometry)) {
          setPolygon(json.geometry);
          fitToBoundary(m, json.geometry);
          setStatus("Saved boundary loaded.");
        }
      } catch (e: any) {
        setStatus(e?.message || "Could not load saved boundary.");
      }
    });

    return () => { m.remove(); map.current = null; };
  }, [token, fieldId, initialBoundary]);

  async function saveBoundary() {
    if (!polygon || !acres) return;
    setStatus("Saving boundary…");
    const res = await fetch(`/api/fields/${fieldId}/boundary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geometry: polygon, acres }) });
    const json = await res.json();
    if (!res.ok) { setStatus(json.error || "Could not save boundary."); return; }
    setDirty(false); setStatus("Boundary saved.");
  }

  async function lookupSoils() {
    if (!polygon || !acres) return;
    setStatus("Saving boundary and looking up USDA soil map units…");
    const boundaryRes = await fetch(`/api/fields/${fieldId}/boundary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geometry: polygon, acres }) });
    const boundaryJson = await boundaryRes.json();
    if (!boundaryRes.ok) { setStatus(boundaryJson.error || "Could not save boundary."); return; }
    setDirty(false);
    setSoils([]);
    const res = await fetch(`/api/fields/${fieldId}/soils`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geometry: polygon }) });
    const json = await res.json();
    if (!res.ok) { setStatus(json.error || "Soil lookup failed."); return; }
    setSoils(json.soils || []);
    setStatus(json.soils?.length ? "USDA soil map saved to this field." : "No mapped soil polygons were returned.");
  }

  if (!token) return <div className="map-config"><strong>Map ready to connect.</strong><br/><span>Add a Mapbox public access token to <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>.</span></div>;

  return <div><div ref={node} className="real-map" />
    <div className="map-tools">
      <div><span className="label">Calculated area</span><div className="value">{acres ? `${acres.toFixed(2)} acres` : "Draw a field boundary"}</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn secondary" disabled={!polygon || !dirty} onClick={saveBoundary}>Save boundary</button><button className="btn" disabled={!polygon} onClick={lookupSoils}>Save & get USDA soils</button></div>
    </div>
    {status?<p className="subtle" style={{fontSize:13}}>{status}</p>:null}
    {soils.length?<table className="table"><thead><tr><th>Symbol</th><th>Soil map unit</th><th>Acres</th><th>Field %</th></tr></thead><tbody>{soils.map(s=><tr key={s.mukey}><td>{s.symbol}</td><td>{s.name}</td><td>{s.acres.toFixed(2)}</td><td>{s.percent.toFixed(1)}%</td></tr>)}</tbody></table>:null}
  </div>;
}
