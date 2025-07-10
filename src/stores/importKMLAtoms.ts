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