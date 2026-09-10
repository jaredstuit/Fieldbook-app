// Minimal WKT -> GeoJSON parser for POLYGON and MULTIPOLYGON, the two
// shapes USDA Soil Data Access returns for clipped soil map unit geometry.
// Not a general-purpose WKT parser -- just enough for this use case.

function extractBetweenFirstAndLastParen(s: string): string {
  const first = s.indexOf("(");
  const last = s.lastIndexOf(")");
  return s.slice(first + 1, last);
}

function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === "," && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts.map(p => p.trim()).filter(Boolean);
}

function parseRing(ringText: string): number[][] {
  const inner = extractBetweenFirstAndLastParen(ringText);
  return inner.split(",").map(pair => {
    const nums = pair.trim().split(/\s+/).map(Number);
    return [nums[0], nums[1]];
  });
}

function parsePolygonBody(bodyText: string): number[][][] {
  return splitTopLevel(bodyText).map(parseRing);
}

export type ParsedGeometry = { type: "Polygon"; coordinates: number[][][] } | { type: "MultiPolygon"; coordinates: number[][][][] };

export function wktToGeoJsonGeometry(wkt: string): ParsedGeometry | null {
  const trimmed = wkt.trim();
  const upper = trimmed.toUpperCase();
  if (!upper.includes("(")) return null;
  const body = extractBetweenFirstAndLastParen(trimmed);

  if (upper.startsWith("MULTIPOLYGON")) {
    const polygonBodies = splitTopLevel(body).map(extractBetweenFirstAndLastParen);
    return { type: "MultiPolygon", coordinates: polygonBodies.map(parsePolygonBody) };
  }
  if (upper.startsWith("POLYGON")) {
    return { type: "Polygon", coordinates: parsePolygonBody(body) };
  }
  return null;
}

// Combines one or more Polygon/MultiPolygon geometries (e.g. several
// disjoint clipped pieces of the same soil map unit) into a single
// MultiPolygon's coordinate list.
export function mergeIntoMultiPolygonCoordinates(geometries: ParsedGeometry[]): number[][][][] {
  const coords: number[][][][] = [];
  for (const g of geometries) {
    if (g.type === "Polygon") coords.push(g.coordinates);
    else coords.push(...g.coordinates);
  }
  return coords;
}
