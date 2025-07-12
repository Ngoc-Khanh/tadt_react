import { Layers } from '@mui/icons-material'
import { Backdrop, Box, Button, Fade, Popper, Typography } from "@mui/material"
import type { LatLngExpression } from 'leaflet'
import { LatLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import AccordionUsage from './map/AccordionUsage'
import RightPanel from './map/RightPanel'
import { useAtom, useSetAtom } from 'jotai'
import { 
  mapRenderDataAtom, 
  zoomToLayerAtom 
} from '@/stores/importKMLAtoms'
import type { PackageAssignment, LayerGroup } from '@/stores/importKMLAtoms'

// Memoized map styles to prevent recreation
const mapContainerStyle = {
  height: '100vh',
  width: '100vw'
}

// Component to handle zoom to layer functionality
const ZoomToLayerController = memo(() => {
  const map = useMap()
  const [zoomToLayer] = useAtom(zoomToLayerAtom)
  const [mapRenderData] = useAtom(mapRenderDataAtom)
  const setZoomToLayer = useSetAtom(zoomToLayerAtom)

  useEffect(() => {
    if (!zoomToLayer || !mapRenderData || !map) return

    // Find the target layer
    let targetLayer = null
    for (const group of mapRenderData.layerGroups) {
      const layer = group.layers.find(l => l.id === zoomToLayer)
      if (layer) {
        targetLayer = layer
        break
      }
    }

    if (!targetLayer || !targetLayer.geometry.length) {
      setZoomToLayer(null)
      return
    }

    // Calculate bounds from layer geometry
    let minLat = Infinity, minLng = Infinity
    let maxLat = -Infinity, maxLng = -Infinity
    let foundValidBounds = false

    targetLayer.geometry.forEach((geom) => {
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

      processCoordinates(geom.coordinates)
    })

    if (foundValidBounds && minLat !== Infinity) {
      const bounds = new LatLngBounds([minLat, minLng], [maxLat, maxLng])
      map.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 1.0
      })
    }

    // Clear zoom target
    setZoomToLayer(null)
  }, [zoomToLayer, mapRenderData, map, setZoomToLayer])

  return null
})

ZoomToLayerController.displayName = 'ZoomToLayerController'

// Optimized component để render imported data
const ImportedDataRenderer = memo(({ 
  layerGroups,
  assignments,
  projectName,
  onFeatureClick 
}: { 
  layerGroups: LayerGroup[]
  assignments: PackageAssignment[]
  projectName: string
  onFeatureClick: (featureId: string, packageInfo?: PackageAssignment) => void
}) => {
  // Memoize assignment lookup for performance
  const assignmentMap = useMemo(() => {
    const map = new Map<string, PackageAssignment>()
    assignments.forEach(a => {
      const key = `${a.groupId}-${a.layerId}-${a.lineStringId}`
      map.set(key, a)
    })
    return map
  }, [assignments])

  // Memoize style to prevent re-creation
  const layerStyle = useMemo(() => ({
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.2
  }), [])

  // Pre-compute all layer data for better performance
  const layerData = useMemo(() => {
    return layerGroups.flatMap((group) =>
      group.layers
        .filter(layer => layer.visible && layer.geometry?.length)
        .map((layer) => {
          const geoJsonData = {
            type: 'FeatureCollection' as const,
            features: layer.geometry.map((geom, index) => {
              const key = `${group.id}-${layer.id}-${index}`
              return {
                type: 'Feature' as const,
                id: key,
                properties: {
                  projectName,
                  groupName: group.name,
                  layerName: layer.name,
                  hasPackage: assignmentMap.has(key)
                },
                geometry: {
                  type: geom.type,
                  coordinates: geom.coordinates
                } as GeoJSON.Geometry
              }
            })
          }

          const style = {
            ...layerStyle,
            color: layer.color,
            fillColor: layer.color
          }

          return {
            key: `${group.id}-${layer.id}`,
            geoJsonData,
            style
          }
        })
    )
  }, [layerGroups, projectName, assignmentMap, layerStyle])

  if (!layerGroups.length) return null

  return (
    <>
      {layerData.map((data) => (
        <GeoJSON
          key={data.key}
          data={data.geoJsonData}
          style={() => data.style}
          onEachFeature={(feature, leafletLayer) => {
            // Simple popup on hover for better UX
            leafletLayer.on('mouseover', () => {
              if (!leafletLayer.getPopup()) {
                const popup = `
                  <div style="font-family: -apple-system, sans-serif; padding: 8px;">
                    <b>${feature.properties?.layerName || 'Layer'}</b><br>
                    <small>Dự án: ${feature.properties?.projectName || 'N/A'}</small><br>
                    <small>${feature.properties?.hasPackage ? '✅ Đã gán gói thầu' : '⚠️ Chưa gán gói thầu'}</small>
                  </div>
                `
                leafletLayer.bindPopup(popup, {
                  maxWidth: 200,
                  closeButton: false
                })
              }
            })

            // Click handler
            leafletLayer.on('click', () => {
              const featureId = feature.id?.toString() || ''
              const packageInfo = assignmentMap.get(featureId)
              onFeatureClick(featureId, packageInfo)
            })
          }}
        />
      ))}
    </>
  )
})

ImportedDataRenderer.displayName = 'ImportedDataRenderer'

export function MapSection() {
  // Tọa độ trung tâm Việt Nam
  const vietnamCenter: LatLngExpression = useMemo(() => [14.0583, 108.2772], [])

  // State cho Layer Panel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const open = Boolean(anchorEl)
  const id = open ? 'layer-panel' : undefined

  // State cho Right Panel
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  
  // State cho imported data
  const [selectedPackageInfo, setSelectedPackageInfo] = useState<PackageAssignment | null>(null)
  
  // Get imported data from atom
  const [mapRenderData] = useAtom(mapRenderDataAtom)
  const setZoomToLayer = useSetAtom(zoomToLayerAtom)

  // Memoized handlers to prevent recreation
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isAnimating) return // Prevent rapid clicks during animation

    setIsAnimating(true)
    setAnchorEl(anchorEl ? null : event.currentTarget)

    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 200)
  }, [anchorEl, isAnimating])

  const handleFeatureClick = useCallback(() => {
    setRightPanelOpen(true)
  }, [])

  const handleRightPanelClose = useCallback(() => {
    setRightPanelOpen(false)
    setSelectedPackageInfo(null)
  }, [])

  const handleImportedFeatureClick = useCallback((featureId: string, packageInfo?: PackageAssignment) => {
    setSelectedPackageInfo(packageInfo || null)
    setRightPanelOpen(true)
  }, [])

  // Handle zoom to specific layer
  const handleZoomToLayer = useCallback((layerId: string) => {
    setZoomToLayer(layerId)
    console.log('[MapSection] Zoom to layer:', layerId)
  }, [setZoomToLayer])

  // Calculate dynamic header info
  const headerInfo = useMemo(() => {
    if (!mapRenderData) {
      return { title: 'Chưa có dữ liệu', subtitle: 'Vui lòng import dữ liệu KML' }
    }

    const totalLayers = mapRenderData.layerGroups.reduce((sum, group) => sum + group.layers.length, 0)
    const totalGroups = mapRenderData.layerGroups.length
    const assignedPackages = mapRenderData.assignments.length

    return {
      title: mapRenderData.projectInfo?.ten_du_an || 'Dự án không xác định',
      subtitle: `${totalGroups} nhóm, ${totalLayers} lớp, ${assignedPackages} gói thầu`
    }
  }, [mapRenderData])

  // Memoized button styles
  const buttonStyles = useMemo(() => ({
    minWidth: 48,
    width: 48,
    height: 48,
    borderRadius: 3,
    bgcolor: open ? 'primary.dark' : 'background.paper',
    color: open ? 'white' : 'text.primary',
    border: open ? 'none' : '1px solid',
    borderColor: 'divider',
    boxShadow: open ? 3 : 2,
    '&:hover': {
      bgcolor: open ? 'primary.dark' : 'grey.100',
      transform: 'translateY(-1px)',
      boxShadow: open ? 4 : 3
    },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:active': {
      transform: 'translateY(0)',
      transition: 'all 0.1s ease'
    }
  }), [open])

  // Memoized popper styles
  const popperStyles = useMemo(() => ({
    bgcolor: 'background.paper',
    minWidth: 620,
    maxWidth: '90vw',
    borderRadius: 3,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
    backdropFilter: 'blur(8px)'
  }), [])

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Layer Panel Toggle Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          display: 'flex',
          gap: 1
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Button
            aria-describedby={id}
            onClick={handleClick}
            variant="contained"
            disabled={isAnimating}
            sx={buttonStyles}
          >
            <Layers fontSize="medium" />
          </Button>
          
          {/* Badge hiển thị số lượng gói thầu */}
          {mapRenderData && mapRenderData.assignments.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: 'error.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                border: '2px solid white',
                boxShadow: 2
              }}
            >
              {mapRenderData.assignments.length}
            </Box>
          )}
        </Box>
      </Box>

      {/* Backdrop for mobile overlay */}
      <Backdrop
        open={open}
        sx={{
          zIndex: 999,
          display: { xs: 'block', md: 'none' }
        }}
        onClick={() => setAnchorEl(null)}
      />

      {/* Layer Panel Popper */}
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={{ zIndex: 1001 }}
        transition
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 16,
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Box sx={popperStyles}>
              {/* Header */}
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'grey.50',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 0.5
                  }}
                >
                  {headerInfo.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  {headerInfo.subtitle}
                </Typography>
              </Box>

              {/* Accordion Layers */}
              <Box
                sx={{
                  p: 2,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  '&::-webkit-scrollbar': {
                    width: 6
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'grey.100',
                    borderRadius: 3
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'grey.400',
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'grey.600'
                    }
                  }
                }}
              >
                <AccordionUsage 
                  onLayerClick={handleFeatureClick} 
                  mapRenderData={mapRenderData}
                  onZoomToLayer={handleZoomToLayer}
                />
              </Box>
            </Box>
          </Fade>
        )}
      </Popper>

      {/* Optimized Map Container */}
      <MapContainer
        center={vietnamCenter}
        zoom={6}
        style={mapContainerStyle}
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={true}
        preferCanvas={true}
      >
        {/* CARTO Positron Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          crossOrigin=""
          keepBuffer={2}
        />

        {/* Imported Data Renderer */}
        {mapRenderData && (
          <ImportedDataRenderer 
            layerGroups={mapRenderData.layerGroups}
            assignments={mapRenderData.assignments}
            projectName={mapRenderData.projectInfo?.ten_du_an || 'Unknown Project'}
            onFeatureClick={handleImportedFeatureClick}
          />
        )}

        {/* Zoom to Layer Controller */}
        <ZoomToLayerController />
      </MapContainer>

      {/* Right Panel for Details */}
      <RightPanel
        open={rightPanelOpen}
        onClose={handleRightPanelClose}
        mapRenderData={mapRenderData}
        selectedPackageInfo={selectedPackageInfo}
      />
    </Box>
  )
}