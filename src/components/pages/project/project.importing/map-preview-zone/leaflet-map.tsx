import type { GeometryData, LayerGroup, SelectedFeature, SelectedLineString } from '@/stores/importKMLAtoms'
import {
  clearFitBoundsAtom,
  manualBoundsAtom,
  selectedFeaturesForMapAtom,
  shouldFitBoundsAtom
} from '@/stores/importKMLAtoms'
import { Layers } from '@mui/icons-material'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import { LayerStatsPanel } from './layer-stats-panel'

// Component để handle map resize với throttling
const MapResizeHandler = React.memo(({ panelVisible }: { panelVisible: boolean }) => {
  const map = useMap()
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleResize = () => {
      // Clear any existing timeout để tránh multiple calls
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      // Sử dụng single timeout với delay tối ưu
      resizeTimeoutRef.current = setTimeout(() => {
        map.invalidateSize(false) // Sử dụng false để không animate
      }, 320) // Delay ngắn hơn nhưng vẫn đảm bảo animation hoàn thành
    }

    // Trigger resize when panel visibility changes
    handleResize()

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [map, panelVisible])

  return null
})

// Component để theo dõi thay đổi kích thước container với throttling
const MapContainerResizeObserver = React.memo(() => {
  const map = useMap()
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!map) return

    const mapContainer = map.getContainer()
    if (!mapContainer) return

    // Tạo ResizeObserver với throttling
    const resizeObserver = new ResizeObserver(() => {
      // Clear existing timeout để tránh quá nhiều calls
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }

      // Throttle resize calls
      throttleTimeoutRef.current = setTimeout(() => {
        map.invalidateSize(false) // Không animate để mượt hơn
      }, 100) // Delay ngắn nhưng vẫn throttle
    })

    resizeObserver.observe(mapContainer)

    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [map])

  return null
})

// Component để tự động fit bounds khi vào map view lần đầu
const FitBoundsController = React.memo(() => {
  const map = useMap()
  const [shouldFitBounds] = useAtom(shouldFitBoundsAtom)
  const [manualBounds] = useAtom(manualBoundsAtom)
  const clearFitBounds = useSetAtom(clearFitBoundsAtom)

  useEffect(() => {
    if (shouldFitBounds && manualBounds && map) {
      const timer = setTimeout(() => {
        try {
          const [[minLat, minLng], [maxLat, maxLng]] = manualBounds

          // Validate bounds
          if (isNaN(minLat) || isNaN(minLng) || isNaN(maxLat) || isNaN(maxLng)) {
            console.warn('[FitBoundsController] Invalid bounds detected:', manualBounds)
            clearFitBounds()
            return
          }

          // Kiểm tra bounds có hợp lệ không
          if (minLat >= maxLat || minLng >= maxLng) {
            console.warn('[FitBoundsController] Invalid bounds range:', manualBounds)
            clearFitBounds()
            return
          }

          // Kiểm tra bounds có quá nhỏ không
          const latDiff = maxLat - minLat
          const lngDiff = maxLng - minLng
          if (latDiff < 0.0001 || lngDiff < 0.0001) {
            console.warn('[FitBoundsController] Bounds too small:', manualBounds)
            clearFitBounds()
            return
          }

          const latLngBounds = new LatLngBounds(
            [minLat, minLng],
            [maxLat, maxLng]
          )

          map.fitBounds(latLngBounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
            duration: 1.5
          })

          console.log('[FitBoundsController] Successfully fitted bounds:', manualBounds)
          clearFitBounds()
        } catch (error) {
          console.error('[FitBoundsController] Error fitting bounds:', error)
          clearFitBounds()
        }
      }, 300)

      return () => clearTimeout(timer)
    } else if (shouldFitBounds && !manualBounds) {
      clearFitBounds()
    }
  }, [shouldFitBounds, manualBounds, map, clearFitBounds])

  return null
})

// Component để expose map reference
const MapRefController = React.memo(({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
  const map = useMap()

  useEffect(() => {
    if (map) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  return null
})

// Convert geometry data sang GeoJSON format
const convertToGeoJSON = (geometry: GeometryData[]): GeoJSON.FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: geometry.map((geom, index) => ({
      type: 'Feature',
      id: index,
      properties: geom.properties || {},
      geometry: {
        type: geom.type,
        coordinates: geom.coordinates
      } as GeoJSON.Geometry
    }))
  }
}

// Component render từng layer với memoization
const LayerRenderer = React.memo(({
  layer,
  groupVisible,
  groupId,
  groupName,
  onOpenAssignPackageDialog
}: {
  layer: {
    id: string
    name: string
    visible: boolean
    color?: string
    geometry?: GeometryData[]
  },
  groupVisible: boolean,
  groupId: string,
  groupName: string,
  onOpenAssignPackageDialog: (selectedLineString: SelectedLineString) => void
}) => {
  const [selectedFeatures] = useAtom(selectedFeaturesForMapAtom)
  const setSelectedFeatures = useSetAtom(selectedFeaturesForMapAtom)

  const geoJsonData = useMemo(() => {
    if (!layer.visible || !groupVisible || !layer.geometry?.length) {
      return null
    }
    return convertToGeoJSON(layer.geometry)
  }, [layer.geometry, layer.visible, groupVisible])

  const layerStyle = useCallback((feature?: GeoJSON.Feature) => {
    const featureId = feature?.id?.toString() || ''
    const isSelected = selectedFeatures.some(f => f.id === featureId)
    // Luôn sử dụng màu primary của MUI làm màu mặc định, bỏ qua layer.color
    const defaultColor = '#1976d2' // MUI primary blue

    return {
      color: isSelected ? '#d32f2f' : defaultColor, // Màu đỏ khi được chọn
      weight: isSelected ? 4 : 3,
      opacity: isSelected ? 1.0 : 0.9,
      fillOpacity: isSelected ? 0.6 : 0.4,
      fillColor: isSelected ? '#d32f2f' : defaultColor, // Màu đỏ khi được chọn
      dashArray: layer.name.includes('Line') ? '5, 5' : undefined
    }
  }, [layer.name, selectedFeatures])

  const onEachFeature = useCallback((feature: GeoJSON.Feature, leafletLayer: L.Layer) => {
    // Handle click event cho feature selection
    leafletLayer.on('click', (e) => {
      const featureId = feature.id?.toString() || `${groupId}-${layer.id}-${Date.now()}`

      // Check if feature is already selected
      const existingIndex = selectedFeatures.findIndex(f => f.id === featureId)

      if (existingIndex >= 0) {
        // Deselect feature
        const newSelection = selectedFeatures.filter(f => f.id !== featureId)
        setSelectedFeatures(newSelection)
      } else {
        // Select feature - tạo SelectedFeature object
        const selectedFeature: SelectedFeature = {
          id: featureId,
          groupId: groupId,
          layerId: layer.id,
          groupName: groupName,
          layerName: layer.name,
          geometry: {
            type: feature.geometry?.type || 'Point',
            coordinates: (feature.geometry as GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon)?.coordinates || [],
            properties: feature.properties || {}
          } as GeometryData,
          properties: feature.properties || {}
        }

        const newSelection = [...selectedFeatures, selectedFeature]
        setSelectedFeatures(newSelection)
      }

      // Prevent event bubbling
      e.originalEvent.stopPropagation()
    })

    // Thêm popup cho LineString
    if (feature.geometry?.type === 'LineString') {
      const featureId = feature.id?.toString() || `${groupId}-${layer.id}-${Date.now()}`

      leafletLayer.bindPopup(() => {
        const popupDiv = document.createElement('div')
        popupDiv.innerHTML = `
          <div style="padding: 8px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="color: #1976d2;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div style="font-weight: 600; color: #1976d2;">LineString</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Feature ID:</div>
              <div style="font-size: 14px; font-weight: 500;">${featureId}</div>
            </div>
            <button 
              id="assign-package-btn-${featureId}" 
              style="
                background: #1976d2;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              "
              onmouseover="this.style.background='#1565c0'"
              onmouseout="this.style.background='#1976d2'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              Đính gói thầu
            </button>
          </div>
        `

        // Thêm event listener cho button sau khi popup được render
        setTimeout(() => {
          const button = document.getElementById(`assign-package-btn-${featureId}`)
          if (button) {
            button.addEventListener('click', () => {
              // Tạo selectedLineString và mở dialog
              const selectedLineString: SelectedLineString = {
                featureId: featureId,
                layerId: layer.id,
                groupId: groupId,
                properties: feature.properties || {},
                geometry: {
                  type: feature.geometry!.type as 'LineString',
                  coordinates: (feature.geometry as GeoJSON.LineString)!.coordinates,
                  properties: feature.properties || {}
                }
              }

              // Mở dialog assign package
              onOpenAssignPackageDialog(selectedLineString)
              leafletLayer.closePopup()
            })
          }
        }, 50)

        return popupDiv
      })
    }
  }, [layer.id, groupId, groupName, layer.name, selectedFeatures, setSelectedFeatures, onOpenAssignPackageDialog])

  if (!geoJsonData) return null

  return (
    <GeoJSON
      key={`${layer.id}-${layer.visible}-${groupVisible}`}
      data={geoJsonData}
      style={layerStyle}
      onEachFeature={onEachFeature}
    />
  )
})

interface LeafletMapProps {
  layerGroups: LayerGroup[]
}

// Component chính
export const LeafletMap = ({
  layerGroups,
}: LeafletMapProps) => {
  const [showLayerPanel, setShowLayerPanel] = useState(true)
  const [assignPackageDialogOpen, setAssignPackageDialogOpen] = useState(false)
  const [selectedLineStringForDialog, setSelectedLineStringForDialog] = useState<SelectedLineString | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const panelTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Effect để handle resize map khi panel state thay đổi với debouncing
  useEffect(() => {
    if (mapRef.current) {
      // Clear existing timeout
      if (panelTimeoutRef.current) {
        clearTimeout(panelTimeoutRef.current)
      }

      // Single resize call với delay tối ưu
      panelTimeoutRef.current = setTimeout(() => {
        mapRef.current?.invalidateSize(false) // Không animate để tránh lag
      }, 350) // Delay để đảm bảo animation hoàn thành

      return () => {
        if (panelTimeoutRef.current) {
          clearTimeout(panelTimeoutRef.current)
        }
      }
    }
  }, [showLayerPanel])

  // Function để navigate đến layer
  const handleNavigateToLayer = useCallback((bounds: [[number, number], [number, number]]) => {
    if (mapRef.current) {
      try {
        const latLngBounds = new LatLngBounds(bounds[0], bounds[1])
        mapRef.current.fitBounds(latLngBounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
          duration: 1.5
        })
      } catch (error) {
        console.error('[LeafletMap] Error navigating to layer:', error)
      }
    }
  }, [])

  // Function để handle assign package dialog
  const handleOpenAssignPackageDialog = useCallback((selectedLineString: SelectedLineString) => {
    setSelectedLineStringForDialog(selectedLineString)
    setAssignPackageDialogOpen(true)
  }, [])

  // Render visible layers với memoization
  const visibleLayers = useMemo(() => {
    return layerGroups
      .filter(group => group.visible)
      .flatMap(group =>
        group.layers.map(layer => (
          <LayerRenderer
            key={layer.id}
            layer={layer}
            groupVisible={group.visible}
            groupId={group.id}
            groupName={group.name}
            onOpenAssignPackageDialog={handleOpenAssignPackageDialog}
          />
        ))
      )
  }, [layerGroups, handleOpenAssignPackageDialog])

  return (
    <div className='h-screen w-full flex'>
      {/* Map Container */}
      <div className='flex-1 relative'>
        <MapContainer
          center={[21.0285, 105.8542]} // Hà Nội mặc định
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          preferCanvas={true}
          attributionControl={true}
          worldCopyJump={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />

          {/* Map resize handler */}
          <MapResizeHandler panelVisible={showLayerPanel} />

          {/* Container resize observer */}
          <MapContainerResizeObserver />

          {/* Controller để tự động fit bounds */}
          <FitBoundsController />

          {/* Controller để expose map reference */}
          <MapRefController onMapReady={(map) => { mapRef.current = map }} />

          {/* Render các layers */}
          {visibleLayers}
        </MapContainer>

        {/* Button để mở Layer Stats Panel - giữ nguyên ở bên phải */}
        {!showLayerPanel && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1000,
              animation: 'slideInFromRight 0.3s ease-out'
            }}
          >
            <Tooltip title="Hiển thị thống kê layers">
              <Button
                onClick={() => setShowLayerPanel(true)}
                variant="contained"
                size="small"
                startIcon={<Layers />}
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  bgcolor: 'primary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: 4,
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Chi tiết ({layerGroups.length})
              </Button>
            </Tooltip>
          </Box>
        )}
      </div>

      {/* Layer Stats Panel - Side Panel bên phải với animation tối ưu */}
      <div
        className={`transition-all duration-300 ease-out ${showLayerPanel ? 'w-96' : 'w-0'
          } flex-shrink-0 overflow-hidden`}
        style={{
          willChange: showLayerPanel ? 'auto' : 'transform', // Tối ưu GPU acceleration
        }}
      >
        {showLayerPanel && (
          <div className="h-full bg-white border-l border-gray-200 shadow-lg w-96">
            <LayerStatsPanel
              open={showLayerPanel}
              onClose={() => setShowLayerPanel(false)}
              onRefresh={() => {
                console.log('Refreshing layer stats...')
              }}
              onNavigateToLayer={handleNavigateToLayer}
              isFullPanel={true}
            />
          </div>
        )}
      </div>

      {/* Dialog đính gói thầu */}
      <Dialog
        open={assignPackageDialogOpen}
        onClose={() => setAssignPackageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Đính gói thầu cho LineString
        </DialogTitle>
        <DialogContent>
          {selectedLineStringForDialog && (
            <div>
              <p><strong>Thông tin LineString:</strong></p>
              <p>Feature ID: {selectedLineStringForDialog.featureId}</p>
              <p>Layer: {selectedLineStringForDialog.layerId}</p>
              <p>Group: {selectedLineStringForDialog.groupId}</p>
              {selectedLineStringForDialog.geometry.coordinates && (
                <p>Số điểm: {selectedLineStringForDialog.geometry.coordinates.length}</p>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignPackageDialogOpen(false)} color="secondary">
            Hủy
          </Button>
          <Button onClick={() => {
            // Xử lý logic đính gói thầu ở đây
            console.log('Đính gói thầu cho:', selectedLineStringForDialog)
            setAssignPackageDialogOpen(false)
          }} color="primary" variant="contained">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
} 