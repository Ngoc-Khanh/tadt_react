export function getLatLngsFromGeom(geom: { type: string; coordinates: unknown }): [number, number][] {
  if (!geom?.coordinates || !Array.isArray(geom.coordinates)) return [];
  let coords = geom.coordinates;
  // Xử lý Polygon: kiểm tra nested structure
  if (geom.type === 'Polygon' && Array.isArray(coords[0]?.[0])) coords = coords[0]; // GeoJSON chuẩn: lấy ring đầu tiên
  return Array.isArray(coords)
    ? coords
      .filter((c): c is number[] => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number')
      .map(([lng, lat]) => [lat, lng])
    : [];
}