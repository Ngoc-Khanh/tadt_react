import { atom } from 'jotai'

// Types
export interface LayerGeometry {
  id: string
  type: 'LineString' | 'Polygon' | 'Point'
  coordinates: number[][] | number[][][]
  properties?: Record<string, unknown>
}

export interface GeometryData {
  type: 'LineString' | 'Polygon' | 'Point'
  coordinates: number[][] | number[][][] | number[]
  properties?: Record<string, unknown>
}

export interface LayerData {
  id: string
  name: string
  visible: boolean
  geometry: GeometryData[]
  color: string
  strokeWidth?: number
}

export interface SelectedFeature {
  id: string
  groupId: string
  layerId: string
  groupName: string
  layerName: string
  geometry: GeometryData
  properties: Record<string, unknown>
}

export interface SelectedLineString {
  featureId: string
  layerId: string
  groupId: string
  properties: Record<string, unknown>
  geometry: {
    type: 'LineString'
    coordinates: number[][]
    properties?: Record<string, unknown>
  }
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  geometry: LayerGeometry[]
  color?: string
  strokeWidth?: number
}

export interface LayerGroup {
  id: string
  name: string
  fileName: string
  layers: Layer[]
  visible: boolean
  bounds?: [[number, number], [number, number]]
}

export interface SuccessfulFile {
  id: string
  name: string
  size: number
  layerGroupId: string
}

export interface PackageAssignment {
  lineStringId: string
  packageId: string
  packageName: string
  groupName: string
  layerName: string
}

// Atoms
export const layerGroupsAtom = atom<LayerGroup[]>([])
export const showMapAtom = atom<boolean>(false)
export const successfulFilesAtom = atom<SuccessfulFile[]>([])
export const packageAssignmentsAtom = atom<PackageAssignment[]>([])
export const showConfirmImportDialogActionAtom = atom<() => void>(() => {})

// Map control atoms
export const shouldFitBoundsAtom = atom<boolean>(false)
export const manualBoundsAtom = atom<[[number, number], [number, number]] | null>(null)
export const selectedFeaturesForMapAtom = atom<SelectedFeature[]>([])
export const selectedLineStringAtom = atom<SelectedLineString | null>(null)

// Derived atoms
export const totalFeaturesAtom = atom<number>((get) => {
  const layerGroups = get(layerGroupsAtom)
  return layerGroups.reduce((total, group) =>
    total + group.layers.reduce((layerTotal, layer) =>
      layerTotal + (layer.geometry?.length || 0), 0
    ), 0
  )
})

// Actions
export const addLayerGroupAtom = atom(
  null,
  (get, set, layerGroup: LayerGroup) => {
    const currentGroups = get(layerGroupsAtom)
    set(layerGroupsAtom, [...currentGroups, layerGroup])
  }
)

export const toggleLayerVisibilityAtom = atom(
  null,
  (get, set, { groupId, layerId }: { groupId: string; layerId: string }) => {
    const currentGroups = get(layerGroupsAtom)
    const updatedGroups = currentGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          layers: group.layers.map(layer => {
            if (layer.id === layerId) {
              return { ...layer, visible: !layer.visible }
            }
            return layer
          })
        }
      }
      return group
    })
    set(layerGroupsAtom, updatedGroups)
  }
)

export const toggleGroupVisibilityAtom = atom(
  null,
  (get, set, groupId: string) => {
    const currentGroups = get(layerGroupsAtom)
    const updatedGroups = currentGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, visible: !group.visible }
      }
      return group
    })
    set(layerGroupsAtom, updatedGroups)
  }
)

export const addSuccessfulFileAtom = atom(
  null,
  (get, set, file: SuccessfulFile) => {
    const currentFiles = get(successfulFilesAtom)
    set(successfulFilesAtom, [...currentFiles, file])
  }
)

export const clearAllDataAtom = atom(
  null,
  (get, set) => {
    set(layerGroupsAtom, [])
    set(successfulFilesAtom, [])
    set(packageAssignmentsAtom, [])
    set(showMapAtom, false)
    set(selectedFeaturesForMapAtom, [])
    set(selectedLineStringAtom, null)
  }
)

// Action atoms cho map control
export const clearFitBoundsAtom = atom(
  null,
  (get, set) => {
    set(shouldFitBoundsAtom, false)
  }
)

export const setSelectedLineStringAtom = atom(
  null,
  (get, set, lineString: SelectedLineString | null) => {
    set(selectedLineStringAtom, lineString)
  }
)

export const setShouldFitBoundsAtom = atom(
  null,
  (get, set, bounds: [[number, number], [number, number]]) => {
    set(manualBoundsAtom, bounds)
    set(shouldFitBoundsAtom, true)
  }
) 