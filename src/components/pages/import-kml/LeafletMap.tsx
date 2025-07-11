import React, { useMemo, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { LatLngBounds, Map as LeafletMapType } from 'leaflet'
import { useAtom, useSetAtom } from 'jotai'
import { 
  shouldFitBoundsAtom, 
  clearFitBoundsAtom, 
  manualBoundsAtom,
  setSelectedLineStringAtom
} from '../../../stores/importKMLAtoms'
import type { LayerGroup, GeometryData, LayerData, SelectedLineString } from '../../../stores/importKMLAtoms'
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

  // Chỉ log, không tự động fit bounds nữa để tránh conflict với FitBoundsController
  useEffect(() => {
    if (bounds && map) {
      console.log('[MapController] Bounds available but not auto-fitting:', bounds)
      // Removed auto-fit logic to avoid conflict with FitBoundsController
    }
  }, [bounds, map])

  return null
})

// Component để tự động fit bounds khi vào map view lần đầu
const FitBoundsController = React.memo(() => {
  const map = useMap()
  const [shouldFitBounds] = useAtom(shouldFitBoundsAtom)
  const [manualBounds] = useAtom(manualBoundsAtom)
  const clearFitBounds = useSetAtom(clearFitBoundsAtom)

  console.log('[FitBoundsController] Component rendered with:', { shouldFitBounds, manualBounds })

  useEffect(() => {
    console.log('[FitBoundsController] Effect triggered:', { shouldFitBounds, manualBounds })
    
    if (shouldFitBounds && manualBounds && map) {
      console.log('[FitBoundsController] Attempting to fit bounds:', manualBounds)
      
      // Delay một chút để đảm bảo map đã render xong
      const timer = setTimeout(() => {
        try {
          const latLngBounds = new LatLngBounds(manualBounds[0], manualBounds[1])
          console.log('[FitBoundsController] Fitting to bounds:', latLngBounds)
          
          map.fitBounds(latLngBounds, { 
            padding: [50, 50],
            maxZoom: 16, // Giới hạn zoom để không zoom quá gần
            animate: true,
            duration: 1.5 // Animation mượt mà hơn
          })
          
          console.log('[FitBoundsController] Fit bounds completed')
          clearFitBounds() // Clear flag sau khi fit bounds
        } catch (error) {
          console.error('[FitBoundsController] Error fitting bounds:', error)
          clearFitBounds()
        }
      }, 300) // Tăng delay để đảm bảo map ready

      return () => clearTimeout(timer)
    } else if (shouldFitBounds && !manualBounds) {
      console.warn('[FitBoundsController] shouldFitBounds=true but manualBounds is undefined')
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
  groupId 
}: { 
  layer: LayerData, 
  groupVisible: boolean,
  groupId: string
}) => {
  const setSelectedLineString = useSetAtom(setSelectedLineStringAtom)
  
  const geoJsonData = useMemo(() => {
    if (!layer.visible || !groupVisible || !layer.geometry?.length) {
      return null
    }
    return convertToGeoJSON(layer.geometry)
  }, [layer.geometry, layer.visible, groupVisible])

  const layerStyle = useMemo(() => ({
    color: layer.color,
    weight: 3,
    opacity: 0.9,
    fillOpacity: 0.4,
    fillColor: layer.color,
    dashArray: layer.name.includes('Line') ? '5, 5' : undefined
  }), [layer.color, layer.name])

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

    // Handle click event cho LineString
    leafletLayer.on('click', (e) => {
      // Chỉ xử lý cho LineString
      if (feature.geometry?.type === 'LineString') {
        console.log('[LayerRenderer] LineString clicked:', feature)
        
        // Tạo SelectedLineString object
        const selectedLineString: SelectedLineString = {
          featureId: feature.id || `${groupId}-${layer.id}-${Date.now()}`,
          layerId: layer.id,
          groupId: groupId,
          properties: feature.properties || {},
          geometry: {
            type: feature.geometry.type as 'LineString',
            coordinates: feature.geometry.coordinates,
            properties: feature.properties || {}
          }
        }
        
        // Set selected LineString để trigger package selection dialog
        setSelectedLineString(selectedLineString)
        
        // Prevent event bubbling
        e.originalEvent.stopPropagation()
      }
    })
  }, [layer.id, groupId, setSelectedLineString])

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
  
  console.log('[LeafletMap] Component rendered with layerGroups:', layerGroups)
  console.log('[LeafletMap] Time:', new Date().toISOString())

  // Fallback function để tính bounds từ geometry data
  const calculateBoundsFromGeometry = (layerGroups: LayerGroup[]) => {
    console.log('[LeafletMap] Calculating bounds from geometry data as fallback')
    
    let minLat = Infinity, minLng = Infinity
    let maxLat = -Infinity, maxLng = -Infinity
    let foundValidBounds = false

    layerGroups.forEach((group, groupIndex) => {
      if (!group.visible) return
      
      group.layers.forEach((layer, layerIndex) => {
        if (!layer.visible || !layer.geometry?.length) return
        
        console.log(`[LeafletMap] Processing layer ${groupIndex}-${layerIndex} geometry:`, layer.geometry.length)
        
        layer.geometry.forEach((geom, geomIndex) => {
          console.log(`[LeafletMap] Processing geometry ${geomIndex}:`, geom.type, geom.coordinates)
          
          const processCoordinate = (coord: number[]) => {
            if (coord.length >= 2) {
              const [lng, lat] = coord
              if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
                minLat = Math.min(minLat, lat)
                minLng = Math.min(minLng, lng)
                maxLat = Math.max(maxLat, lat)
                maxLng = Math.max(maxLng, lng)
                foundValidBounds = true
                console.log(`[LeafletMap] Updated bounds: lat(${minLat}, ${maxLat}) lng(${minLng}, ${maxLng})`)
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

    if (!foundValidBounds || minLat === Infinity) {
      console.log('[LeafletMap] No valid coordinates found in fallback calculation')
      return undefined
    }
    
    const result = [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
    console.log('[LeafletMap] Fallback calculated bounds:', result)
    return result
  }

  // Tính toán bounds tổng hợp từ tất cả layers visible
  const totalBounds = useMemo(() => {
    console.log('[LeafletMap] Starting totalBounds calculation')
    console.log('[LeafletMap] All layerGroups:', layerGroups)
    
    const visibleGroups = layerGroups.filter(group => group.visible)
    console.log('[LeafletMap] Visible groups after filter:', visibleGroups)
    console.log('[LeafletMap] Calculating totalBounds from visible groups:', visibleGroups.length)
    
    if (!visibleGroups.length) {
      console.log('[LeafletMap] No visible groups, totalBounds = undefined')
      return undefined
    }

    let minLat = Infinity, minLng = Infinity
    let maxLat = -Infinity, maxLng = -Infinity
    let foundValidBounds = false

    visibleGroups.forEach((group, index) => {
      console.log(`[LeafletMap] Processing group ${index}:`, {
        name: group.name,
        visible: group.visible, 
        bounds: group.bounds,
        hasBounds: !!group.bounds
      })
      
      if (group.bounds) {
        const [[groupMinLat, groupMinLng], [groupMaxLat, groupMaxLng]] = group.bounds
        console.log(`[LeafletMap] Group ${index} bounds:`, {
          min: [groupMinLat, groupMinLng],
          max: [groupMaxLat, groupMaxLng]
        })
        
        minLat = Math.min(minLat, groupMinLat)
        minLng = Math.min(minLng, groupMinLng)
        maxLat = Math.max(maxLat, groupMaxLat)
        maxLng = Math.max(maxLng, groupMaxLng)
        foundValidBounds = true
        
        console.log(`[LeafletMap] Updated bounds so far:`, {
          min: [minLat, minLng],
          max: [maxLat, maxLng]
        })
      } else {
        console.warn(`[LeafletMap] Group ${index} has no bounds:`, group.name)
      }
    })

    // Nếu không tìm thấy bounds từ groups, thử tính từ geometry data
    if (!foundValidBounds || minLat === Infinity) {
      console.log('[LeafletMap] No valid bounds from groups, trying fallback calculation')
      return calculateBoundsFromGeometry(layerGroups)
    }
    
    const result = [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
    console.log('[LeafletMap] Final calculated totalBounds:', result)
    return result
  }, [layerGroups])

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