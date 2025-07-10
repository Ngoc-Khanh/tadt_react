import React, { useMemo, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { LatLngBounds, Map as LeafletMapType } from 'leaflet'
import type { LayerGroup, GeometryData, LayerData } from '../../../stores/importKMLAtoms'
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

// Component để fit bounds khi có data mới
const MapController = React.memo(({ bounds }: { bounds?: [[number, number], [number, number]] }) => {
  const map = useMap()

  useEffect(() => {
    if (bounds && map) {
      const latLngBounds = new LatLngBounds(bounds[0], bounds[1])
      map.fitBounds(latLngBounds, { padding: [20, 20] })
    }
  }, [bounds, map])

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
  groupVisible 
}: { 
  layer: LayerData, 
  groupVisible: boolean 
}) => {
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

  const onEachFeature = useCallback((feature: GeoJSON.Feature, layer: L.Layer) => {
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
      
      layer.bindPopup(popupContent, {
        maxWidth: 350,
        className: 'custom-popup'
      })
    }
  }, [])

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

// Component chính
export const LeafletMap = React.memo<LeafletMapProps>(({ 
  layerGroups, 
  height = '100%',
  onLayoutChange
}) => {
  const mapRef = useRef<LeafletMapType | null>(null)

  // Tính toán bounds tổng hợp từ tất cả layers visible
  const totalBounds = useMemo(() => {
    const visibleGroups = layerGroups.filter(group => group.visible)
    if (!visibleGroups.length) return undefined

    let minLat = Infinity, minLng = Infinity
    let maxLat = -Infinity, maxLng = -Infinity

    visibleGroups.forEach(group => {
      if (group.bounds) {
        const [[groupMinLat, groupMinLng], [groupMaxLat, groupMaxLng]] = group.bounds
        minLat = Math.min(minLat, groupMinLat)
        minLng = Math.min(minLng, groupMinLng)
        maxLat = Math.max(maxLat, groupMaxLat)
        maxLng = Math.max(maxLng, groupMaxLng)
      }
    })

    if (minLat === Infinity) return undefined
    return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
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
        
        {/* Render các layers */}
        {visibleLayers}
      </MapContainer>
    </div>
  )
})

LeafletMap.displayName = 'LeafletMap' 