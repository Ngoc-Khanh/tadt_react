import React, { useMemo, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import { useAtom, useSetAtom } from 'jotai'
import { 
  shouldFitBoundsAtom, 
  clearFitBoundsAtom, 
  manualBoundsAtom,
  setSelectedLineStringAtom,
  selectedFeaturesForMapAtom
} from '@/stores/importKMLAtoms'
import type { LayerGroup, GeometryData, SelectedLineString, SelectedFeature } from '@/stores/importKMLAtoms'
import 'leaflet/dist/leaflet.css'

// Component để handle map resize
const MapResizeHandler = React.memo(() => {
  const map = useMap()

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
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
          const latLngBounds = new LatLngBounds(manualBounds[0], manualBounds[1])
          
          map.fitBounds(latLngBounds, { 
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
            duration: 1.5
          })
          
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
  groupName
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
  groupName: string
}) => {
  const setSelectedLineString = useSetAtom(setSelectedLineStringAtom)
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
    const defaultColor = layer.color || '#3388ff' // Default Leaflet blue
    
    return {
      color: isSelected ? '#ff6b35' : defaultColor,
      weight: isSelected ? 4 : 3,
      opacity: isSelected ? 1.0 : 0.9,
      fillOpacity: isSelected ? 0.6 : 0.4,
      fillColor: isSelected ? '#ff6b35' : defaultColor,
      dashArray: layer.name.includes('Line') ? '5, 5' : undefined
    }
  }, [layer.color, layer.name, selectedFeatures])

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
              
              setSelectedLineString(selectedLineString)
              leafletLayer.closePopup()
            })
          }
        }, 50)
        
        return popupDiv
      })
    }
  }, [layer.id, groupId, groupName, layer.name, setSelectedLineString, selectedFeatures, setSelectedFeatures])

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
  height?: string | number
}

// Component chính
export const LeafletMap = ({ 
  layerGroups, 
  height = '100%'
}: LeafletMapProps) => {
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
          />
        ))
      )
  }, [layerGroups])

  return (
    <div style={{ height, width: '100%' }}>
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
        <MapResizeHandler />
        
        {/* Controller để tự động fit bounds */}
        <FitBoundsController />
        
        {/* Render các layers */}
        {visibleLayers}
      </MapContainer>
    </div>
  )
} 