import { Layers, Refresh } from '@mui/icons-material'
import { Backdrop, Box, Button, Fade, Popper, Typography, CircularProgress, Alert } from "@mui/material"
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { MapContainer, Polygon, TileLayer, useMapEvents, GeoJSON } from 'react-leaflet'
import AccordionUsage from './map/AccordionUsage'
import RightPanel from './map/RightPanel'
import { useImportedData } from '@/hooks/useImportedData'
import type { ImportedLayerData } from '@/services/assignment.api'

// Sample polygon data - moved outside component to avoid recreation
const samplePolygon = {
  id: 'polygon_001',
  name: 'Polygon_001',
  description: 'Tòa nhà',
  coordinates: [
    [21.0350, 105.8500],
    [21.0400, 105.8550],
    [21.0380, 105.8600],
    [21.0320, 105.8580],
    [21.0300, 105.8530],
    [21.0350, 105.8500]
  ] as LatLngExpression[],
  color: '#2196f3',
  fillColor: '#2196f3',
  fillOpacity: 0.4
}

// Memoized map styles to prevent recreation
const mapContainerStyle = {
  height: '100vh',
  width: '100vw'
}

// Memoized polygon path options
const polygonPathOptions = {
  color: samplePolygon.color,
  fillColor: samplePolygon.fillColor,
  fillOpacity: samplePolygon.fillOpacity,
  weight: 3,
  opacity: 0.9
}

// Optimized Map Event Handler
const MapEventHandler = memo(() => {
  useMapEvents({
    click: () => {
      // Handle general map click if needed
    },
  })
  return null
})

MapEventHandler.displayName = 'MapEventHandler'

// Memoized Polygon Component
const MemoizedPolygon = memo(({ onClick }: { onClick: () => void }) => {
  const eventHandlers = useMemo(() => ({
    click: onClick,
    mouseover: (e: LeafletMouseEvent) => {
      const target = e.target as { setStyle: (style: object) => void };
      target.setStyle({
        fillOpacity: 0.7,
        weight: 4
      });
    },
    mouseout: (e: LeafletMouseEvent) => {
      const target = e.target as { setStyle: (style: object) => void };
      target.setStyle({
        fillOpacity: samplePolygon.fillOpacity,
        weight: 3
      });
    }
  }), [onClick])

  return (
    <Polygon
      positions={samplePolygon.coordinates}
      pathOptions={polygonPathOptions}
      eventHandlers={eventHandlers}
    />
  )
})

MemoizedPolygon.displayName = 'MemoizedPolygon'

// Component để render imported data
const ImportedDataRenderer = memo(({ 
  importedDataList, 
  onFeatureClick 
}: { 
  importedDataList: ImportedLayerData[]
  onFeatureClick: (data: ImportedLayerData, featureId: string) => void
}) => {
  if (!importedDataList.length) return null

  return (
    <>
      {importedDataList.map((importData) => 
        importData.layer_groups.map((group) =>
          group.layers.map((layer) => {
            if (!layer.visible || !layer.geometry?.length) return null

            // Convert geometry to GeoJSON
            const geoJsonData = {
              type: 'FeatureCollection' as const,
              features: layer.geometry.map((geom, index) => ({
                type: 'Feature' as const,
                id: `${importData.import_id}-${group.id}-${layer.id}-${index}`,
                properties: {
                  ...geom.properties,
                  importId: importData.import_id,
                  projectName: importData.project_name,
                  groupName: group.name,
                  layerName: layer.name,
                  // Find assigned package for this feature
                  assignedPackage: importData.assignments.find(a => 
                    a.groupId === group.id && 
                    a.layerId === layer.id && 
                    a.lineStringId === index
                  )
                },
                geometry: {
                  type: geom.type,
                  coordinates: geom.coordinates
                } as GeoJSON.Geometry
              }))
            }

            return (
              <GeoJSON
                key={`${importData.import_id}-${group.id}-${layer.id}`}
                data={geoJsonData}
                style={() => ({
                  color: layer.color,
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.3,
                  fillColor: layer.color
                })}
                onEachFeature={(feature, leafletLayer) => {
                  const props = feature.properties
                  const assignedPackage = props?.assignedPackage

                  // Popup content
                  const popupContent = `
                    <div style="font-family: 'Roboto', sans-serif; max-width: 300px;">
                      <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 12px; margin: -10px -10px 10px -10px; border-radius: 8px 8px 0 0;">
                        <h4 style="margin: 0; font-size: 14px; font-weight: 600;">Dữ liệu đã import</h4>
                      </div>
                      <div style="padding: 4px 0;">
                        <div style="margin: 8px 0; padding: 6px; background: #e3f2fd; border-radius: 4px;">
                          <strong style="color: #1976d2;">Dự án:</strong> ${props?.projectName || 'N/A'}<br>
                          <strong style="color: #1976d2;">Layer:</strong> ${props?.layerName || 'N/A'}
                        </div>
                        ${assignedPackage ? `
                          <div style="margin: 8px 0; padding: 6px; background: #f3e5f5; border-radius: 4px; border-left: 3px solid #9c27b0;">
                            <strong style="color: #9c27b0;">Gói thầu:</strong><br>
                            <span style="color: #333; font-size: 13px;">${assignedPackage.packageName}</span>
                          </div>
                        ` : `
                          <div style="margin: 8px 0; padding: 6px; background: #fff3e0; border-radius: 4px; border-left: 3px solid #ff9800;">
                            <span style="color: #f57c00; font-size: 12px;">Chưa gán gói thầu</span>
                          </div>
                        `}
                      </div>
                    </div>
                  `

                  leafletLayer.bindPopup(popupContent, {
                    maxWidth: 350,
                    className: 'custom-popup'
                  })

                  // Click handler
                  leafletLayer.on('click', () => {
                    onFeatureClick(importData, feature.id?.toString() || '')
                  })
                }}
              />
            )
          })
        )
      )}
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
  const [selectedImportData, setSelectedImportData] = useState<ImportedLayerData | null>(null)
  
  // Fetch imported data
  const {
    data: importedDataList = [],
    isLoading: isLoadingImported,
    error: importedError,
    refetch: refetchImported
  } = useImportedData()

  // Memoized handlers to prevent recreation
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isAnimating) return // Prevent rapid clicks during animation

    setIsAnimating(true)
    setAnchorEl(anchorEl ? null : event.currentTarget)

    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 200)
  }, [anchorEl, isAnimating])

  const handlePolygonClick = useCallback(() => {
    setRightPanelOpen(true)
  }, [])

  const handleRightPanelClose = useCallback(() => {
    setRightPanelOpen(false)
  }, [])

  const handleImportedFeatureClick = useCallback((data: ImportedLayerData, featureId: string) => {
    setSelectedImportData(data)
    setRightPanelOpen(true)
    console.log('[MapSection] Imported feature clicked:', { data, featureId })
  }, [setSelectedImportData, setRightPanelOpen])

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
    willChange: 'transform, box-shadow, background-color',
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
    backdropFilter: 'blur(8px)',
    willChange: 'transform, opacity'
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
        <Button
          aria-describedby={id}
          onClick={handleClick}
          variant="contained"
          disabled={isAnimating}
          sx={buttonStyles}
        >
          <Layers fontSize="medium" />
        </Button>

        {/* Refresh Button for Imported Data */}
        <Button
          onClick={() => refetchImported()}
          variant="outlined"
          disabled={isLoadingImported}
          sx={{
            minWidth: 48,
            width: 48,
            height: 48,
            borderRadius: 3,
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'grey.100',
              transform: 'translateY(-1px)',
              boxShadow: 3
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isLoadingImported ? (
            <CircularProgress size={20} />
          ) : (
            <Refresh fontSize="medium" />
          )}
        </Button>
      </Box>

      {/* Error Alert for imported data */}
      {importedError && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'absolute',
            top: 80,
            left: 16,
            right: 16,
            zIndex: 1000,
            maxWidth: 400
          }}
          action={
            <Button color="inherit" size="small" onClick={() => refetchImported()}>
              Thử lại
            </Button>
          }
        >
          Lỗi khi tải dữ liệu đã import: {importedError.message}
        </Alert>
      )}

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
                  Danh sách lớp và khu vực
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  3 lớp, 3 khu vực
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
                <AccordionUsage onLayerClick={handlePolygonClick} />
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

        {/* Optimized Polygon */}
        <MemoizedPolygon onClick={handlePolygonClick} />

        {/* Imported Data Renderer */}
        <ImportedDataRenderer 
          importedDataList={importedDataList}
          onFeatureClick={handleImportedFeatureClick}
        />

        {/* Map Event Handler */}
        <MapEventHandler />
      </MapContainer>

      {/* Right Panel for Details */}
      <RightPanel
        open={rightPanelOpen}
        onClose={handleRightPanelClose}
        importedData={selectedImportData}
      />
    </Box>
  )
}