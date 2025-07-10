import * as toGeoJSON from '@tmcw/togeojson'
import JSZip from 'jszip'
import type { GeometryData, LayerData, LayerGroup } from '../stores/importKMLAtoms'

interface ParsedKMLResult {
  layerGroup: LayerGroup
  success: boolean
  error?: string
}

// Calculate bounds từ geometry coordinates
const calculateBounds = (geometries: GeometryData[]): [[number, number], [number, number]] | undefined => {
  if (!geometries.length) return undefined

  let minLat = Infinity, minLng = Infinity
  let maxLat = -Infinity, maxLng = -Infinity

  geometries.forEach(geom => {
    const coords = geom.coordinates

    const processCoordinate = (coord: number[]) => {
      if (coord.length >= 2) {
        const [lng, lat] = coord
        minLat = Math.min(minLat, lat)
        minLng = Math.min(minLng, lng)
        maxLat = Math.max(maxLat, lat)
        maxLng = Math.max(maxLng, lng)
      }
    }

    const processCoordinates = (coords: any, depth = 0) => {
      if (Array.isArray(coords)) {
        if (depth === 0 && typeof coords[0] === 'number') {
          // Single coordinate [lng, lat]
          processCoordinate(coords)
        } else {
          // Nested arrays
          coords.forEach(c => processCoordinates(c, depth + 1))
        }
      }
    }

    processCoordinates(coords)
  })

  if (minLat === Infinity) return undefined
  return [[minLat, minLng], [maxLat, maxLng]]
}

// Generate color cho từng loại geometry
const getColorForGeometryType = (type: string, index: number): string => {
  const colors = {
    Point: ['#4CAF50', '#66BB6A', '#81C784'],
    LineString: ['#2196F3', '#42A5F5', '#64B5F6'], 
    Polygon: ['#FF5722', '#FF7043', '#FF8A65'],
    MultiPolygon: ['#9C27B0', '#AB47BC', '#BA68C8']
  }
  
  const typeColors = colors[type as keyof typeof colors] || ['#607D8B']
  return typeColors[index % typeColors.length]
}

// Group geometries by type
const groupGeometriesByType = (features: GeoJSON.Feature[]): Record<string, GeometryData[]> => {
  const groups: Record<string, GeometryData[]> = {}

  features.forEach(feature => {
    if (!feature.geometry) return

    const geomType = feature.geometry.type
    if (!groups[geomType]) {
      groups[geomType] = []
    }

    // Convert properties safely
    const properties: Record<string, string | number | boolean> = {}
    if (feature.properties) {
      Object.entries(feature.properties).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          properties[key] = value
        } else if (value !== null && value !== undefined) {
          properties[key] = String(value)
        }
      })
    }

    groups[geomType].push({
      type: geomType as GeometryData['type'],
      coordinates: feature.geometry.coordinates as any,
      properties
    })
  })

  return groups
}

// Parse KML content
const parseKMLContent = async (xmlContent: string, fileName: string): Promise<ParsedKMLResult> => {
  try {
    // Parse XML
    const parser = new DOMParser()
    const kmlDoc = parser.parseFromString(xmlContent, 'application/xml')
    
    // Check for parsing errors
    const parserError = kmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Invalid KML format')
    }

    // Convert to GeoJSON
    const geoJson = toGeoJSON.kml(kmlDoc)
    
    if (!geoJson.features || geoJson.features.length === 0) {
      throw new Error('No geometric features found in KML file')
    }

    console.log(`[KMLParser] Successfully parsed ${geoJson.features.length} features from ${fileName}`)

    // Group geometries by type
    const geometryGroups = groupGeometriesByType(geoJson.features)
    
    // Create layers for each geometry type
    const layers: LayerData[] = []
    Object.entries(geometryGroups).forEach(([type, geometries], index) => {
      if (geometries.length > 0) {
        const layerBounds = calculateBounds(geometries)
        
        layers.push({
          id: `${type.toLowerCase()}-${Date.now()}-${index}`,
          name: `${type} (${geometries.length})`,
          visible: true,
          color: getColorForGeometryType(type, index),
          geometry: geometries,
          bounds: layerBounds
        })
      }
    })

    // Calculate overall bounds
    const allGeometries = Object.values(geometryGroups).flat()
    const overallBounds = calculateBounds(allGeometries)

    const layerGroup: LayerGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: fileName.replace(/\.(kml|kmz)$/i, ''),
      visible: true,
      bounds: overallBounds,
      layers
    }

    return {
      layerGroup,
      success: true
    }

  } catch (error) {
    console.error('[KMLParser] Error parsing KML:', error)
    return {
      layerGroup: {} as LayerGroup,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

// Parse KMZ file (ZIP containing KML)
const parseKMZContent = async (file: File): Promise<ParsedKMLResult> => {
  try {
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)
    
    // Find KML file in ZIP
    let kmlFile: JSZip.JSZipObject | null = null
    
    Object.keys(zipContent.files).forEach(filename => {
      if (filename.toLowerCase().endsWith('.kml') && !zipContent.files[filename].dir) {
        kmlFile = zipContent.files[filename]
      }
    })

    if (!kmlFile) {
      throw new Error('No KML file found in KMZ archive')
    }

    const kmlContent = await kmlFile.async('text')
    return parseKMLContent(kmlContent, file.name)

  } catch (error) {
    console.error('[KMLParser] Error parsing KMZ:', error)
    return {
      layerGroup: {} as LayerGroup,
      success: false,
      error: error instanceof Error ? error.message : 'Error reading KMZ file'
    }
  }
}

// Main parser function
export const parseKMLFile = async (file: File): Promise<ParsedKMLResult> => {
  const fileExtension = file.name.toLowerCase().split('.').pop()
  
  console.log(`[KMLParser] Starting to parse ${file.name} (${file.size} bytes)`)

  try {
    if (fileExtension === 'kmz') {
      return await parseKMZContent(file)
    } else if (fileExtension === 'kml') {
      const content = await file.text()
      return await parseKMLContent(content, file.name)
    } else {
      return {
        layerGroup: {} as LayerGroup,
        success: false,
        error: `Unsupported file format: .${fileExtension}`
      }
    }
  } catch (error) {
    console.error('[KMLParser] File processing error:', error)
    return {
      layerGroup: {} as LayerGroup,
      success: false,
      error: error instanceof Error ? error.message : 'File processing failed'
    }
  }
}

// Utility function to validate KML/KMZ file
export const isValidKMLFile = (file: File): boolean => {
  const allowedExtensions = ['kml', 'kmz']
  const fileExtension = file.name.toLowerCase().split('.').pop()
  return allowedExtensions.includes(fileExtension || '')
} 