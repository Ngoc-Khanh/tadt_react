import { atom } from 'jotai'

export interface ImportedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'success' | 'error'
  progress: number
}

export interface GeometryData {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon'
  coordinates: number[] | number[][] | number[][][]
  properties?: Record<string, string | number | boolean>
}

export interface LayerData {
  id: string
  name: string
  visible: boolean
  color: string
  geometry: GeometryData[]
  bounds?: [[number, number], [number, number]] // [[minLat, minLng], [maxLat, maxLng]]
}

export interface LayerGroup {
  id: string
  name: string
  visible: boolean
  layers: LayerData[]
  bounds?: [[number, number], [number, number]]
}

export interface SnackbarState {
  open: boolean
  message: string
}

// Atoms
export const filesAtom = atom<ImportedFile[]>([])
export const layerGroupsAtom = atom<LayerGroup[]>([])
export const showMapAtom = atom<boolean>(false)
export const snackbarAtom = atom<SnackbarState>({ open: false, message: '' })
export const dragActiveAtom = atom<boolean>(false)
export const shouldFitBoundsAtom = atom<boolean>(false)
export const manualBoundsAtom = atom<[[number, number], [number, number]] | undefined>(undefined)

// Derived atoms
export const successfulFilesAtom = atom((get) => 
  get(filesAtom).filter(f => f.status === 'success')
)

export const pendingFilesAtom = atom((get) => 
  get(filesAtom).filter(f => f.status === 'pending')
)

export const errorFilesAtom = atom((get) => 
  get(filesAtom).filter(f => f.status === 'error')
)

// Actions
export const addFilesAtom = atom(
  null,
  (get, set, newFiles: ImportedFile[]) => {
    set(filesAtom, [...get(filesAtom), ...newFiles])
  }
)

export const updateFileAtom = atom(
  null,
  (get, set, fileId: string, updates: Partial<ImportedFile>) => {
    set(filesAtom, 
      get(filesAtom).map(f => 
        f.id === fileId ? { ...f, ...updates } : f
      )
    )
  }
)

export const removeFileAtom = atom(
  null,
  (get, set, fileId: string) => {
    set(filesAtom, get(filesAtom).filter(f => f.id !== fileId))
  }
)

export const clearAllFilesAtom = atom(
  null,
  (get, set) => {
    set(filesAtom, [])
  }
)

export const addLayerGroupAtom = atom(
  null,
  (get, set, layerGroup: LayerGroup) => {
    set(layerGroupsAtom, [...get(layerGroupsAtom), layerGroup])
  }
)

export const toggleLayerGroupVisibilityAtom = atom(
  null,
  (get, set, groupId: string) => {
    set(layerGroupsAtom, 
      get(layerGroupsAtom).map(group => 
        group.id === groupId ? { ...group, visible: !group.visible } : group
      )
    )
  }
)

export const toggleLayerVisibilityAtom = atom(
  null,
  (get, set, groupId: string, layerId: string) => {
    set(layerGroupsAtom, 
      get(layerGroupsAtom).map(group => 
        group.id === groupId 
          ? {
              ...group,
              layers: group.layers.map(layer =>
                layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
              )
            }
          : group
      )
    )
  }
)

export const showSnackbarAtom = atom(
  null,
  (get, set, message: string) => {
    set(snackbarAtom, { open: true, message })
  }
)

export const hideSnackbarAtom = atom(
  null,
  (get, set) => {
    set(snackbarAtom, { open: false, message: '' })
  }
)

export const showMapWithFitBoundsAtom = atom(
  null,
  (get, set) => {
    console.log('[showMapWithFitBoundsAtom] Triggering show map with fit bounds')
    
    // Tính bounds từ tất cả layer groups hiện có
    const layerGroups = get(layerGroupsAtom)
    const allGeometries: GeometryData[] = []
    
    layerGroups.forEach(group => {
      group.layers.forEach(layer => {
        allGeometries.push(...layer.geometry)
      })
    })
    
    if (allGeometries.length > 0) {
      const bounds = calculateBoundsFromGeometry(allGeometries)
      if (bounds) {
        set(manualBoundsAtom, bounds)
      }
    }
    
    set(showMapAtom, true)
    set(shouldFitBoundsAtom, true)
    console.log('[showMapWithFitBoundsAtom] Set showMapAtom=true, shouldFitBoundsAtom=true')
  }
)

export const clearFitBoundsAtom = atom(
  null,
  (get, set) => {
    console.log('[clearFitBoundsAtom] Clearing fit bounds flag')
    set(shouldFitBoundsAtom, false)
  }
)

// Action để fit bounds cho specific layer hoặc group
export const fitToLayerAtom = atom(
  null,
  (get, set, layerId: string) => {
    const layerGroups = get(layerGroupsAtom)
    
    // Tìm layer trong tất cả groups
    let targetBounds: [[number, number], [number, number]] | undefined
    
    for (const group of layerGroups) {
      for (const layer of group.layers) {
        if (layer.id === layerId && layer.bounds) {
          targetBounds = layer.bounds
          break
        }
      }
      if (targetBounds) break
    }
    
    // Nếu không tìm thấy bounds từ layer, tính toán từ geometry
    if (!targetBounds) {
      for (const group of layerGroups) {
        for (const layer of group.layers) {
          if (layer.id === layerId && layer.geometry.length > 0) {
            targetBounds = calculateBoundsFromGeometry(layer.geometry)
            break
          }
        }
        if (targetBounds) break
      }
    }
    
    if (targetBounds) {
      set(manualBoundsAtom, targetBounds)
      set(shouldFitBoundsAtom, true)
    }
  }
)

export const fitToGroupAtom = atom(
  null,
  (get, set, groupId: string) => {
    const layerGroups = get(layerGroupsAtom)
    const group = layerGroups.find(g => g.id === groupId)
    
    if (!group) return
    
    let targetBounds = group.bounds
    
    // Nếu group không có bounds, tính từ tất cả layers trong group
    if (!targetBounds) {
      const allGeometries: GeometryData[] = []
      group.layers.forEach(layer => {
        allGeometries.push(...layer.geometry)
      })
      
      if (allGeometries.length > 0) {
        targetBounds = calculateBoundsFromGeometry(allGeometries)
      }
    }
    
    if (targetBounds) {
      set(manualBoundsAtom, targetBounds)
      set(shouldFitBoundsAtom, true)
    }
  }
)

// Helper function để tính bounds từ geometry data
const calculateBoundsFromGeometry = (geometries: GeometryData[]): [[number, number], [number, number]] | undefined => {
  if (!geometries.length) return undefined
  
  let minLat = Infinity, minLng = Infinity
  let maxLat = -Infinity, maxLng = -Infinity
  let foundValidBounds = false
  
  geometries.forEach(geom => {
    const processCoordinate = (coord: number[]) => {
      if (coord.length >= 2) {
        const [lng, lat] = coord
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          minLat = Math.min(minLat, lat)
          minLng = Math.min(minLng, lng)
          maxLat = Math.max(maxLat, lat)
          maxLng = Math.max(maxLng, lng)
          foundValidBounds = true
        }
      }
    }
    
    const processCoordinates = (coords: unknown): void => {
      if (Array.isArray(coords)) {
        if (typeof coords[0] === 'number') {
          processCoordinate(coords)
        } else {
          coords.forEach(processCoordinates)
        }
      }
    }
    
    if (geom.coordinates) {
      processCoordinates(geom.coordinates)
    }
  })
  
  return foundValidBounds ? [[minLat, minLng], [maxLat, maxLng]] : undefined
} 