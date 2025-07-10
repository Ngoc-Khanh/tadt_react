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
  console.log('[KMLParser] calculateBounds called with geometries:', geometries.length)
  
  if (!geometries.length) {
    console.log('[KMLParser] No geometries, returning undefined')
    return undefined
  }

  let minLat = Infinity, minLng = Infinity
  let maxLat = -Infinity, maxLng = -Infinity

  geometries.forEach((geom, index) => {
    console.log(`[KMLParser] Processing geometry ${index}:`, {
      type: geom.type,
      coordinates: geom.coordinates,
      coordinatesLength: Array.isArray(geom.coordinates) ? geom.coordinates.length : 'not array'
    })
    
    const coords = geom.coordinates

    const processCoordinate = (coord: number[]) => {
      console.log('[KMLParser] Processing coordinate:', coord)
      if (coord.length >= 2) {
        const [lng, lat] = coord
        console.log('[KMLParser] Extracted lng/lat:', { lng, lat })
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          minLat = Math.min(minLat, lat)
          minLng = Math.min(minLng, lng)
          maxLat = Math.max(maxLat, lat)
          maxLng = Math.max(maxLng, lng)
          console.log('[KMLParser] Updated bounds:', { minLat, minLng, maxLat, maxLng })
        } else {
          console.warn('[KMLParser] Invalid lng/lat values:', { lng, lat })
        }
      } else {
        console.warn('[KMLParser] Coordinate has insufficient length:', coord)
      }
    }

    const processCoordinates = (coords: unknown, depth = 0) => {
      console.log(`[KMLParser] processCoordinates depth ${depth}:`, coords)
      
      if (Array.isArray(coords)) {
        if (depth === 0 && typeof coords[0] === 'number') {
          // Single coordinate [lng, lat]
          console.log('[KMLParser] Found single coordinate array')
          processCoordinate(coords)
        } else {
          // Nested arrays
          console.log('[KMLParser] Found nested arrays, processing each item')
          coords.forEach((c, i) => {
            console.log(`[KMLParser] Processing nested item ${i}:`, c)
            processCoordinates(c, depth + 1)
          })
        }
      } else {
        console.warn('[KMLParser] coords is not an array:', coords)
      }
    }

    processCoordinates(coords)
  })

  console.log('[KMLParser] Final bounds calculation:', { minLat, minLng, maxLat, maxLng })

  if (minLat === Infinity) {
    console.log('[KMLParser] No valid coordinates found, returning undefined')
    return undefined
  }
  
  const result = [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
  console.log('[KMLParser] Calculated bounds result:', result)
  return result
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
    if (!feature.geometry) {
      console.log('[KMLParser] Feature has no geometry, skipping')
      return
    }

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

    // Type-safe coordinate extraction
    let coordinates: unknown
    if ('coordinates' in feature.geometry) {
      coordinates = feature.geometry.coordinates
    } else {
      console.warn('[KMLParser] Geometry has no coordinates property:', feature.geometry)
      return
    }

    groups[geomType].push({
      type: geomType as GeometryData['type'],
      coordinates: coordinates as number[] | number[][] | number[][][], // Proper coordinate type
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
    const geometryGroups = groupGeometriesByType(geoJson.features.filter(f => f.geometry !== null) as GeoJSON.Feature<GeoJSON.Geometry>[])
    
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

    const kmlContent = await (kmlFile as JSZip.JSZipObject).async('text')
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