import * as toGeoJSON from '@tmcw/togeojson'
import JSZip from 'jszip'
import type { GeometryData, LayerData, LayerGroup } from '../stores/importKMLAtoms'

interface ParsedKMLResult {
  layerGroup: LayerGroup
  success: boolean
  error?: string
}

// Utility function để yield control back to browser
const yieldToBrowser = (): Promise<void> => {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(() => resolve(), 0)
    }
  })
}

// Chunk processing helper
const processInChunks = async <T>(
  items: T[],
  chunkSize: number,
  processor: (item: T, index: number) => void
): Promise<void> => {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    chunk.forEach((item, chunkIndex) => {
      processor(item, i + chunkIndex)
    })
    
    // Yield control every chunk to prevent UI blocking
    if (i + chunkSize < items.length) {
      await yieldToBrowser()
    }
  }
}

// Calculate bounds từ geometry coordinates với tối ưu hóa
const calculateBounds = async (geometries: GeometryData[], abortSignal?: AbortSignal): Promise<[[number, number], [number, number]] | undefined> => {
  if (!geometries.length) return undefined

  let minLat = Infinity, minLng = Infinity
  let maxLat = -Infinity, maxLng = -Infinity
  let hasValidCoords = false

  const processCoordinate = (coord: number[]) => {
    if (coord.length >= 2) {
      const [lng, lat] = coord
      if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
        minLat = Math.min(minLat, lat)
        minLng = Math.min(minLng, lng)
        maxLat = Math.max(maxLat, lat)
        maxLng = Math.max(maxLng, lng)
        hasValidCoords = true
      }
    }
  }

  const processCoordinates = (coords: unknown): void => {
    if (Array.isArray(coords)) {
      if (coords.length > 0 && typeof coords[0] === 'number') {
        // Single coordinate [lng, lat]
        processCoordinate(coords)
      } else {
        // Nested arrays
        coords.forEach(c => processCoordinates(c))
      }
    }
  }

  // Process geometries in chunks to prevent UI blocking
  await processInChunks(geometries, 100, (geom) => {
    // Check cancellation in processing
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }
    
    processCoordinates(geom.coordinates)
  })

  if (!hasValidCoords) return undefined
  
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

// Group geometries by type với tối ưu hóa
const groupGeometriesByType = async (features: GeoJSON.Feature[], abortSignal?: AbortSignal): Promise<Record<string, GeometryData[]>> => {
  const groups: Record<string, GeometryData[]> = {}

  // Process features in chunks to prevent UI blocking
  await processInChunks(features, 50, (feature) => {
    // Check cancellation in processing
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }
    
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

    // Type-safe coordinate extraction
    let coordinates: unknown
    if ('coordinates' in feature.geometry) {
      coordinates = feature.geometry.coordinates
    } else {
      return
    }

    groups[geomType].push({
      type: geomType as GeometryData['type'],
      coordinates: coordinates as number[] | number[][] | number[][][],
      properties
    })
  })

  return groups
}

// Parse KML content với tối ưu hóa
const parseKMLContent = async (xmlContent: string, fileName: string, abortSignal?: AbortSignal): Promise<ParsedKMLResult> => {
  try {
    // Check if cancelled before starting
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    // Parse XML
    const parser = new DOMParser()
    const kmlDoc = parser.parseFromString(xmlContent, 'application/xml')
    
    // Check for parsing errors
    const parserError = kmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Invalid KML format')
    }

    // Check cancellation after XML parsing
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    // Convert to GeoJSON
    const geoJson = toGeoJSON.kml(kmlDoc)
    
    if (!geoJson.features || geoJson.features.length === 0) {
      throw new Error('No geometric features found in KML file')
    }

    // Yield control after initial parsing
    await yieldToBrowser()

    // Check cancellation before processing
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    // Group geometries by type với chunking
    const geometryGroups = await groupGeometriesByType(
      geoJson.features.filter(f => f.geometry !== null) as GeoJSON.Feature<GeoJSON.Geometry>[],
      abortSignal
    )
    
    // Check cancellation after grouping
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }
    
    // Create layers for each geometry type
    const layers: LayerData[] = []
    const groupEntries = Object.entries(geometryGroups)
    
    for (let i = 0; i < groupEntries.length; i++) {
      const [type, geometries] = groupEntries[i]
      
      // Check cancellation in loop
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled')
      }
      
      if (geometries.length > 0) {
        const layerBounds = await calculateBounds(geometries, abortSignal)
        
        layers.push({
          id: `${type.toLowerCase()}-${Date.now()}-${i}`,
          name: `${type} (${geometries.length})`,
          visible: true,
          color: getColorForGeometryType(type, i),
          geometry: geometries,
          bounds: layerBounds
        })
      }
      
      // Yield control after processing each layer
      if (i < groupEntries.length - 1) {
        await yieldToBrowser()
      }
    }

    // Check cancellation before final step
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    // Calculate overall bounds
    const allGeometries = Object.values(geometryGroups).flat()
    const overallBounds = await calculateBounds(allGeometries, abortSignal)

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
    // Handle cancellation
    if (error instanceof Error && (error.message === 'Operation cancelled' || error.name === 'AbortError')) {
      console.log(`[KMLParser] Content parsing cancelled for ${fileName}`)
      return {
        layerGroup: {} as LayerGroup,
        success: false,
        error: 'Operation cancelled'
      }
    }
    
    console.error('[KMLParser] Error parsing KML:', error)
    return {
      layerGroup: {} as LayerGroup,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

// Parse KMZ file (ZIP containing KML)
const parseKMZContent = async (file: File, abortSignal?: AbortSignal): Promise<ParsedKMLResult> => {
  try {
    // Check if cancelled before starting
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    const zip = new JSZip()
    const zipContent = await zip.loadAsync(file)
    
    // Check cancellation after loading ZIP
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }
    
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

    // Check cancellation before reading KML content
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    const kmlContent = await (kmlFile as JSZip.JSZipObject).async('text')
    return parseKMLContent(kmlContent, file.name, abortSignal)

  } catch (error) {
    // Handle cancellation
    if (error instanceof Error && (error.message === 'Operation cancelled' || error.name === 'AbortError')) {
      console.log(`[KMLParser] KMZ parsing cancelled for ${file.name}`)
      return {
        layerGroup: {} as LayerGroup,
        success: false,
        error: 'Operation cancelled'
      }
    }
    
    console.error('[KMLParser] Error parsing KMZ:', error)
    return {
      layerGroup: {} as LayerGroup,
      success: false,
      error: error instanceof Error ? error.message : 'Error reading KMZ file'
    }
  }
}

// Main parser function
export const parseKMLFile = async (file: File, abortSignal?: AbortSignal): Promise<ParsedKMLResult> => {
  const fileExtension = file.name.toLowerCase().split('.').pop()
  
  console.log(`[KMLParser] Starting to parse ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

  try {
    // Check if cancelled before starting
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled')
    }

    if (fileExtension === 'kmz') {
      return await parseKMZContent(file, abortSignal)
    } else if (fileExtension === 'kml') {
      const content = await file.text()
      
      // Check cancellation after reading file
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled')
      }
      
      return await parseKMLContent(content, file.name, abortSignal)
    } else {
      return {
        layerGroup: {} as LayerGroup,
        success: false,
        error: `Unsupported file format: .${fileExtension}`
      }
    }
  } catch (error) {
    // Handle cancellation
    if (error instanceof Error && (error.message === 'Operation cancelled' || error.name === 'AbortError')) {
      console.log(`[KMLParser] Parsing cancelled for ${file.name}`)
      return {
        layerGroup: {} as LayerGroup,
        success: false,
        error: 'Operation cancelled'
      }
    }
    
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