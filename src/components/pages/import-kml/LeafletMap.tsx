import React, { useMemo, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { LatLngBounds, Map as LeafletMapType } from 'leaflet'
import { useAtom, useSetAtom } from 'jotai'
import { 
  shouldFitBoundsAtom, 
  clearFitBoundsAtom, 
  manualBoundsAtom,
  setSelectedLineStringAtom,
  selectedFeaturesForMapAtom
} from '@/stores/importKMLAtoms'
import type { LayerGroup, GeometryData, LayerData, SelectedLineString, SelectedFeature } from '@/stores/importKMLAtoms'
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

    // Listen for window resize
    window.addEventListener('resize', handleResize)
    
    // Initial invalidation
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [map])

  return null
})

interface LeafletMapProps {
  layerGroups: LayerGroup[]
  height?: string | number
  onLayoutChange?: boolean // Trigger khi layout thay đổi
}

// Component để fit bounds khi có data mới hoặc khi shouldFitBounds = true
const MapController = React.memo(({ bounds }: { bounds?: [[number, number], [number, number]] }) => {
  const map = useMap()

        // Removed logging for better performance
      useEffect(() => {
        // Controller is simplified for performance
      }, [bounds, map])

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
      // Delay một chút để đảm bảo map đã render xong
      const timer = setTimeout(() => {
        try {
          const latLngBounds = new LatLngBounds(manualBounds[0], manualBounds[1])
          
          map.fitBounds(latLngBounds, { 
            padding: [50, 50],
            maxZoom: 16, // Giới hạn zoom để không zoom quá gần
            animate: true,
            duration: 1.5 // Animation mượt mà hơn
          })
          
          clearFitBounds() // Clear flag sau khi fit bounds
        } catch (error) {
          console.error('[FitBoundsController] Error fitting bounds:', error)
          clearFitBounds()
        }
      }, 300) // Tăng delay để đảm bảo map ready

      return () => clearTimeout(timer)
    } else if (shouldFitBounds && !manualBounds) {
      clearFitBounds()
    }
  }, [shouldFitBounds, manualBounds, map, clearFitBounds])

  return null
})

// Component để handle layout changes
const LayoutChangeHandler = React.memo(({ trigger }: { trigger?: boolean }) => {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 350) // Delay để animation hoàn thành

    return () => clearTimeout(timer)
  }, [trigger, map])

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
  layer: LayerData, 
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
    
    return {
      color: isSelected ? '#ff6b35' : layer.color,
      weight: isSelected ? 4 : 3,
      opacity: isSelected ? 1.0 : 0.9,
      fillOpacity: isSelected ? 0.6 : 0.4,
      fillColor: isSelected ? '#ff6b35' : layer.color,
      dashArray: layer.name.includes('Line') ? '5, 5' : undefined
    }
  }, [layer.color, layer.name, selectedFeatures])

  const onEachFeature = useCallback((feature: GeoJSON.Feature, leafletLayer: L.Layer) => {
    // Bind popup với thông tin feature
    if (feature.properties && Object.keys(feature.properties).length > 0) {
      const entries = Object.entries(feature.properties)
      const popupContent = `
        <div style="font-family: 'Roboto', sans-serif; max-width: 300px;">
          <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 12px; margin: -10px -10px 10px -10px; border-radius: 8px 8px 0 0;">
            <h4 style="margin: 0; font-size: 14px; font-weight: 600;">Chi tiết Feature</h4>
          </div>
          <div style="padding: 4px 0;">
            ${entries.map(([key, value]) => 
              `<div style="margin: 8px 0; padding: 6px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #1976d2;">
                <strong style="color: #1976d2; font-size: 12px; text-transform: uppercase;">${key}:</strong><br>
                <span style="color: #333; font-size: 13px;">${value}</span>
              </div>`
            ).join('')}
          </div>
        </div>
      `
      
      leafletLayer.bindPopup(popupContent, {
        maxWidth: 350,
        className: 'custom-popup'
      })
    }

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
      
      // For LineString, also trigger package selection dialog
      if (feature.geometry?.type === 'LineString') {
        const selectedLineString: SelectedLineString = {
          featureId: featureId,
          layerId: layer.id,
          groupId: groupId,
          properties: feature.properties || {},
          geometry: {
            type: feature.geometry.type as 'LineString',
            coordinates: feature.geometry.coordinates,
            properties: feature.properties || {}
          }
        }
        
        setSelectedLineString(selectedLineString)
      }
      
      // Prevent event bubbling
      e.originalEvent.stopPropagation()
    })
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

// Component chính (tạm thời loại bỏ memo để debug)
export const LeafletMap = ({ 
  layerGroups, 
  height = '100%',
  onLayoutChange
}: LeafletMapProps) => {
  const mapRef = useRef<LeafletMapType | null>(null)

  // Optimized fallback function để tính bounds từ geometry data
  const calculateBoundsFromGeometry = (layerGroups: LayerGroup[]) => {
    let minLat = Infinity, minLng = Infinity
    let maxLat = -Infinity, maxLng = -Infinity
    let foundValidBounds = false

    layerGroups.forEach((group) => {
      if (!group.visible) return
      
      group.layers.forEach((layer) => {
        if (!layer.visible || !layer.geometry?.length) return
        
        layer.geometry.forEach((geom) => {
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

          const processCoordinates = (coords: unknown, depth = 0): void => {
            if (Array.isArray(coords)) {
              if (depth === 0 && typeof coords[0] === 'number') {
                processCoordinate(coords)
              } else {
                coords.forEach(c => processCoordinates(c, depth + 1))
              }
            }
          }

          processCoordinates(geom.coordinates)
        })
      })
    })

    return foundValidBounds && minLat !== Infinity 
      ? [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
      : undefined
  }

  // Optimized bounds calculation
  const totalBounds = useMemo(() => {
    const visibleGroups = layerGroups.filter(group => group.visible)
    
    if (!visibleGroups.length) {
      return undefined
    }

    let minLat = Infinity, minLng = Infinity
    let maxLat = -Infinity, maxLng = -Infinity
    let foundValidBounds = false

    visibleGroups.forEach((group) => {
      if (group.bounds) {
        const [[groupMinLat, groupMinLng], [groupMaxLat, groupMaxLng]] = group.bounds
        
        minLat = Math.min(minLat, groupMinLat)
        minLng = Math.min(minLng, groupMinLng)
        maxLat = Math.max(maxLat, groupMaxLat)
        maxLng = Math.max(maxLng, groupMaxLng)
        foundValidBounds = true
      }
    })

    // Nếu không tìm thấy bounds từ groups, thử tính từ geometry data
    if (!foundValidBounds || minLat === Infinity) {
      return calculateBoundsFromGeometry(layerGroups)
    }
    
    return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
  }, [layerGroups, calculateBoundsFromGeometry])

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
        ref={mapRef}
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
        
        {/* Layout change handler */}
        <LayoutChangeHandler trigger={onLayoutChange} />
        
        {/* Controller để fit bounds */}
        <MapController bounds={totalBounds} />
        
        {/* Controller để tự động fit bounds */}
        <FitBoundsController />
        
        {/* Render các layers */}
        {visibleLayers}
      </MapContainer>
    </div>
  )
} 