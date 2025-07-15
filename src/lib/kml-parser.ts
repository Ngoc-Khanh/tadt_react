import { type Layer, type LayerGeometry, type LayerGroup } from '@/stores/importKMLAtoms'
import JSZip from 'jszip'
import { calculateBoundsFromGeometries } from './get-lat-lags-from-geom'

// Parse KML text to GeoJSON-like structure
function parseKMLToGeoJSON(kmlText: string): LayerGeometry[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(kmlText, 'text/xml')
  
  const features: LayerGeometry[] = []
  
  // Parse Placemarks
  const placemarks = doc.querySelectorAll('Placemark')
  
  placemarks.forEach((placemark, index) => {
    const name = placemark.querySelector('name')?.textContent || `Feature ${index + 1}` 
    const description = placemark.querySelector('description')?.textContent || ''
    
    // Parse LineString
    const lineString = placemark.querySelector('LineString coordinates')
    if (lineString) {
      const coordinatesText = lineString.textContent?.trim()
      if (coordinatesText) {
        const coordinates = parseCoordinates(coordinatesText)
        if (coordinates.length > 1) {
          features.push({
            id: `linestring-${Date.now()}-${index}`,
            type: 'LineString',
            coordinates: coordinates,
            properties: {
              name,
              description
            }
          })
        }
      }
    }
    
    // Parse Polygon
    const polygon = placemark.querySelector('Polygon outerBoundaryIs LinearRing coordinates')
    if (polygon) {
      const coordinatesText = polygon.textContent?.trim()
      if (coordinatesText) {
        const coordinates = parseCoordinates(coordinatesText)
        if (coordinates.length > 2) {
          features.push({
            id: `polygon-${Date.now()}-${index}`,
            type: 'Polygon',
            coordinates: [coordinates], // Polygon cần array of arrays
            properties: {
              name,
              description
            }
          })
        }
      }
    }
    
    // Parse Point
    const point = placemark.querySelector('Point coordinates')
    if (point) {
      const coordinatesText = point.textContent?.trim()
      if (coordinatesText) {
        const coordinates = parseCoordinates(coordinatesText)
        if (coordinates.length > 0) {
          features.push({
            id: `point-${Date.now()}-${index}`,
            type: 'Point',
            coordinates: [coordinates[0]], // Point chỉ cần 1 coordinate
            properties: {
              name,
              description
            }
          })
        }
      }
    }
  })
  
  return features
}

// Parse coordinates string từ KML
function parseCoordinates(coordinatesText: string): number[][] {
  return coordinatesText
    .split(/\s+/)
    .filter(coord => coord.trim().length > 0)
    .map(coord => {
      const parts = coord.split(',')
      return [
        parseFloat(parts[0]), // longitude
        parseFloat(parts[1]), // latitude
        parts[2] ? parseFloat(parts[2]) : 0 // altitude (optional)
      ]
    })
    .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]))
}

// Generate default color cho layer
function generateDefaultColor(): string {
  return '#1976d2' // MUI primary blue
}

// Main function để xử lý file KML/KMZ
export async function parseKMLFile(file: File): Promise<LayerGroup> {
  const fileName = file.name
  const isKMZ = fileName.toLowerCase().endsWith('.kmz')
  
  let kmlContent: string
  
  if (isKMZ) {
    // Xử lý file KMZ (ZIP)
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)
    
    // Tìm file .kml trong ZIP
    const kmlFile = Object.keys(zipContent.files).find(name => 
      name.toLowerCase().endsWith('.kml')
    )
    
    if (!kmlFile) {
      throw new Error('Không tìm thấy file KML trong KMZ')
    }
    
    kmlContent = await zipContent.files[kmlFile].async('text')
  } else {
    // Xử lý file KML trực tiếp
    kmlContent = await file.text()
  }
  
  // Parse KML content
  const geometries = parseKMLToGeoJSON(kmlContent)
  
  // Group geometries by type
  const layerMap = new Map<string, LayerGeometry[]>()
  
  geometries.forEach(geom => {
    const key = geom.type
    if (!layerMap.has(key)) {
      layerMap.set(key, [])
    }
    layerMap.get(key)!.push(geom)
  })
  
  // Calculate bounds sử dụng function mới
  const bounds = calculateBoundsFromGeometries(geometries)

  // Create layers
  const layers: Layer[] = Array.from(layerMap.entries()).map(([type, geoms]) => ({
    id: `layer-${type}-${Date.now()}`,
    name: `${type} (${geoms.length})`,
    visible: true,
    geometry: geoms,
    color: generateDefaultColor(),
    strokeWidth: 2
  }))
  
  return {
    id: `group-${Date.now()}`,
    name: fileName.replace(/\.(kml|kmz)$/i, ''),
    fileName: fileName,
    layers: layers,
    visible: true,
    bounds: bounds || undefined
  }
}

// Validate file
export function validateKMLFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedExtensions = ['.kml', '.kmz']
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File quá lớn (tối đa 50MB)' }
  }
  
  const extension = file.name.toLowerCase().match(/\.(kml|kmz)$/)
  if (!extension || !allowedExtensions.includes(extension[0])) {
    return { isValid: false, error: 'Chỉ chấp nhận file .kml hoặc .kmz' }
  }
  
  return { isValid: true }
} 