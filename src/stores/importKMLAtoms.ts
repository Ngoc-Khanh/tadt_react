import type { IMapResponse, IPackageResponse } from '@/constants/interfaces'
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

// Package selection interface
export interface SelectedLineString {
  featureId: string | number
  layerId: string
  groupId: string
  properties?: Record<string, string | number | boolean>
  geometry?: GeometryData
}

// Atoms
export const filesAtom = atom<ImportedFile[]>([])
export const layerGroupsAtom = atom<LayerGroup[]>([])
export const showMapAtom = atom<boolean>(false)
export const snackbarAtom = atom<SnackbarState>({ open: false, message: '' })
export const dragActiveAtom = atom<boolean>(false)
export const shouldFitBoundsAtom = atom<boolean>(false)
export const manualBoundsAtom = atom<[[number, number], [number, number]] | undefined>(undefined)

// Project selection atoms
export const selectedProjectAtom = atom<IMapResponse | null>(null)

// Package selection atoms
export const selectedLineStringAtom = atom<SelectedLineString | null>(null)
export const selectedPackageAtom = atom<IPackageResponse | null>(null)
export const showPackageSelectionDialogAtom = atom<boolean>(false)

// Package assignments tracking
export interface PackageAssignment {
  id: string
  lineStringId: string | number
  packageId: string
  packageName: string
  layerId: string
  groupId: string
  groupName: string
  layerName: string
  timestamp: string
}

export const packageAssignmentsAtom = atom<PackageAssignment[]>([])
export const showConfirmImportDialogAtom = atom<boolean>(false)

// Shared data for map rendering (được set sau khi import)
export const mapRenderDataAtom = atom<{
  layerGroups: LayerGroup[]
  assignments: PackageAssignment[]
  projectInfo: IMapResponse | null
  importedAt: string
} | null>(null)

// Selected features for main map (individual features)
export interface SelectedFeature {
  id: string // featureId
  groupId: string
  layerId: string
  groupName: string
  layerName: string
  geometry: GeometryData
  properties?: Record<string, string | number | boolean>
}

export const selectedFeaturesForMapAtom = atom<SelectedFeature[]>([])
export const zoomToLayerAtom = atom<string | null>(null)

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

// Derived atom to check if user can view map (must have selected project + successful files)
export const canViewMapAtom = atom((get) => {
  const selectedProject = get(selectedProjectAtom)
  const successfulFiles = get(successfulFilesAtom)
  
  return selectedProject !== null && successfulFiles.length > 0
})

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

export const setSelectedProjectAtom = atom(
  null,
  (get, set, project: IMapResponse | null) => {
    set(selectedProjectAtom, project)
    console.log('[setSelectedProjectAtom] Selected project:', project?.ten_du_an || 'None')
  }
)

// Package selection actions
export const setSelectedLineStringAtom = atom(
  null,
  (get, set, lineString: SelectedLineString | null) => {
    set(selectedLineStringAtom, lineString)
    if (lineString) {
      console.log('[setSelectedLineStringAtom] Selected LineString:', lineString)
      set(showPackageSelectionDialogAtom, true)
    }
  }
)

export const setSelectedPackageAtom = atom(
  null,
  (get, set, packageData: IPackageResponse | null) => {
    set(selectedPackageAtom, packageData)
    console.log('[setSelectedPackageAtom] Selected package:', packageData?.ten_goi_thau || 'None')
  }
)

export const assignPackageToLineStringAtom = atom(
  null,
  (get, set) => {
    const selectedLineString = get(selectedLineStringAtom)
    const selectedPackage = get(selectedPackageAtom)
    const layerGroups = get(layerGroupsAtom)
    
    if (selectedLineString && selectedPackage) {
      // Tìm thông tin group và layer name
      const group = layerGroups.find(g => g.id === selectedLineString.groupId)
      const layer = group?.layers.find(l => l.id === selectedLineString.layerId)
      
      // Tạo assignment object
      const assignment: PackageAssignment = {
        id: `${selectedLineString.groupId}-${selectedLineString.layerId}-${selectedLineString.featureId}`,
        lineStringId: selectedLineString.featureId,
        packageId: selectedPackage.package_id,
        packageName: selectedPackage.ten_goi_thau,
        layerId: selectedLineString.layerId,
        groupId: selectedLineString.groupId,
        groupName: group?.name || 'Unknown Group',
        layerName: layer?.name || 'Unknown Layer',
        timestamp: new Date().toISOString()
      }
      
      // Thêm assignment vào list (hoặc update nếu đã tồn tại)
      const currentAssignments = get(packageAssignmentsAtom)
      const existingIndex = currentAssignments.findIndex(a => a.id === assignment.id)
      
      if (existingIndex >= 0) {
        // Update existing assignment
        const updatedAssignments = [...currentAssignments]
        updatedAssignments[existingIndex] = assignment
        set(packageAssignmentsAtom, updatedAssignments)
      } else {
        // Add new assignment
        set(packageAssignmentsAtom, [...currentAssignments, assignment])
      }
      
      console.log('[assignPackageToLineStringAtom] Package assigned:', assignment)
      
      // Reset selection và đóng dialog
      set(selectedLineStringAtom, null)
      set(selectedPackageAtom, null)
      set(showPackageSelectionDialogAtom, false)
      
      // Show success message
      set(snackbarAtom, { 
        open: true, 
        message: `Đã gán gói thầu "${selectedPackage.ten_goi_thau}" thành công!` 
      })
    }
  }
)

export const closePackageSelectionDialogAtom = atom(
  null,
  (get, set) => {
    set(showPackageSelectionDialogAtom, false)
    set(selectedLineStringAtom, null)
    set(selectedPackageAtom, null)
  }
)

// Confirm import actions
export const showConfirmImportDialogActionAtom = atom(
  null,
  (get, set) => {
    set(showConfirmImportDialogAtom, true)
  }
)

export const closeConfirmImportDialogAtom = atom(
  null,
  (get, set) => {
    set(showConfirmImportDialogAtom, false)
  }
)

// Direct import to map without API call
export const confirmImportToMapAtom = atom(
  null,
  (get, set) => {
    const assignments = get(packageAssignmentsAtom)
    const selectedProject = get(selectedProjectAtom)
    const selectedFeatures = get(selectedFeaturesForMapAtom)
    
    if (!selectedProject) {
      set(snackbarAtom, { 
        open: true, 
        message: 'Vui lòng chọn dự án trước khi import!' 
      })
      return false
    }

    if (selectedFeatures.length === 0) {
      set(snackbarAtom, { 
        open: true, 
        message: 'Vui lòng chọn ít nhất một feature để import!' 
      })
      return false
    }

    // Group selected features by group and layer
    interface GroupedLayer {
      id: string
      name: string
      visible: boolean
      color: string
      geometry: GeometryData[]
    }
    
    interface GroupedGroup {
      id: string
      name: string
      visible: boolean
      layers: Record<string, GroupedLayer>
      bounds?: [[number, number], [number, number]]
    }
    
    const groupedFeatures = selectedFeatures.reduce((acc, feature) => {
      if (!acc[feature.groupId]) {
        acc[feature.groupId] = {
          id: feature.groupId,
          name: feature.groupName,
          visible: true,
          layers: {},
          bounds: undefined
        }
      }
      
      if (!acc[feature.groupId].layers[feature.layerId]) {
        acc[feature.groupId].layers[feature.layerId] = {
          id: feature.layerId,
          name: feature.layerName,
          visible: true,
          color: '#2196f3', // Default color
          geometry: []
        }
      }
      
      acc[feature.groupId].layers[feature.layerId].geometry.push(feature.geometry)
      return acc
    }, {} as Record<string, GroupedGroup>)

    // Convert to LayerGroup format
    const filteredLayerGroups = Object.values(groupedFeatures).map(group => ({
      ...group,
      layers: Object.values(group.layers)
    }))

    // Filter assignments to only include selected features
    const filteredAssignments = assignments.filter(assignment => 
      selectedFeatures.some(feature => 
        feature.groupId === assignment.groupId && 
        feature.layerId === assignment.layerId
      )
    )
    
    // Set data for map rendering
    set(mapRenderDataAtom, {
      layerGroups: filteredLayerGroups,
      assignments: filteredAssignments,
      projectInfo: selectedProject,
      importedAt: new Date().toISOString()
    })
    
    console.log('[confirmImportToMapAtom] Data set for map rendering:', {
      selectedFeaturesCount: selectedFeatures.length,
      groupsCount: filteredLayerGroups.length,
      assignments: filteredAssignments.length,
      project: selectedProject.ten_du_an
    })
    
    return true
  }
)

// Action to clear data after successful import
export const clearImportDataAtom = atom(
  null,
  (get, set) => {
    // Clear all import data
    set(filesAtom, [])
    set(layerGroupsAtom, [])
    set(packageAssignmentsAtom, [])
    set(selectedProjectAtom, null)
    set(showConfirmImportDialogAtom, false)
    
    console.log('[clearImportDataAtom] Import data cleared')
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
    
    // Kiểm tra điều kiện trước khi hiển thị map
    const canViewMap = get(canViewMapAtom)
    if (!canViewMap) {
      const selectedProject = get(selectedProjectAtom)
      const successfulFiles = get(successfulFilesAtom)
      
      let errorMessage = ''
      if (!selectedProject) {
        errorMessage = 'Vui lòng chọn dự án trước khi xem bản đồ'
      } else if (successfulFiles.length === 0) {
        errorMessage = 'Vui lòng upload ít nhất một file KML/KMZ thành công trước khi xem bản đồ'
      }
      
      if (errorMessage) {
        set(snackbarAtom, { open: true, message: errorMessage })
        return
      }
    }
    
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