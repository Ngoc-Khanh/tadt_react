import { Layers } from '@mui/icons-material'
import { Backdrop, Box, Button, Fade, Popper, Typography } from "@mui/material"
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { MapContainer, Polygon, TileLayer, useMapEvents } from 'react-leaflet'
import AccordionUsage from './map/AccordionUsage'
import RightPanel from './map/RightPanel'

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

        {/* Map Event Handler */}
        <MapEventHandler />
      </MapContainer>

      {/* Right Panel for Details */}
      <RightPanel
        open={rightPanelOpen}
        onClose={handleRightPanelClose}
      />
    </Box>
  )
}