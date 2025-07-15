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

// Tính toán bounds từ nhiều geometries
export function calculateBoundsFromGeometries(geometries: Array<{ type: string; coordinates: unknown }>): [[number, number], [number, number]] | null {
  if (!geometries || geometries.length === 0) return null;
  
  let minLat = Infinity, minLng = Infinity;
  let maxLat = -Infinity, maxLng = -Infinity;
  let hasValidCoords = false;
  
  geometries.forEach(geom => {
    const latLngs = getLatLngsFromGeom(geom);
    
    latLngs.forEach(([lat, lng]) => {
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        minLat = Math.min(minLat, lat);
        minLng = Math.min(minLng, lng);
        maxLat = Math.max(maxLat, lat);
        maxLng = Math.max(maxLng, lng);
        hasValidCoords = true;
      }
    });
  });
  
  if (!hasValidCoords) return null;
  
  return [[minLat, minLng], [maxLat, maxLng]];
}

// Tính toán bounds với padding
export function calculateBoundsWithPadding(
  bounds: [[number, number], [number, number]], 
  paddingPercent: number = 0.1
): [[number, number], [number, number]] {
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;
  
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // Padding tối thiểu 0.01 độ, tối đa 0.1 độ
  const padding = Math.max(0.01, Math.min(0.1, maxDiff * paddingPercent));
  
  return [
    [minLat - padding, minLng - padding],
    [maxLat + padding, maxLng + padding]
  ];
}