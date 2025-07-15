import React from 'react'
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  Chip, 
  Typography, 
  LinearProgress, 
  IconButton,
  Tooltip
} from '@mui/material'
import { 
  Layers, 
  Refresh, 
  Close,
  Visibility,
  VisibilityOff,
  Assignment,
  LocationOn
} from '@mui/icons-material'
import { useAtom, useSetAtom } from 'jotai'
import { 
  layerGroupsAtom, 
  selectedFeaturesForMapAtom,
  setSelectedLineStringAtom,
  toggleLayerVisibilityAtom,
  toggleGroupVisibilityAtom
} from '@/stores/importKMLAtoms'
import type { LayerGroup, SelectedLineString, Layer } from '@/stores/importKMLAtoms'

interface LayerStatsPanelProps {
  open: boolean
  onClose: () => void
  onRefresh?: () => void
  isLoading?: boolean
  error?: string
  onNavigateToLayer?: (bounds: [[number, number], [number, number]]) => void
}

// Helper function để tính toán thống kê
const calculateLayerStats = (layerGroups: LayerGroup[]) => {
  const stats = {
    totalGroups: layerGroups.length,
    totalLayers: 0,
    totalFeatures: 0,
    visibleLayers: 0,
    lineStrings: 0,
    polygons: 0,
    points: 0
  }

  layerGroups.forEach(group => {
    if (group.visible) {
      group.layers.forEach(layer => {
        stats.totalLayers++
        if (layer.visible) {
          stats.visibleLayers++
        }
        
        layer.geometry?.forEach(geom => {
          stats.totalFeatures++
          switch (geom.type) {
            case 'LineString':
              stats.lineStrings++
              break
            case 'Polygon':
              stats.polygons++
              break
            case 'Point':
              stats.points++
              break
          }
        })
      })
    }
  })

  return stats
}

// Helper function để format tên layer
const formatLayerName = (name: string) => {
  if (name.length > 30) {
    return name.substring(0, 30) + '...'
  }
  return name
}

export const LayerStatsPanel: React.FC<LayerStatsPanelProps> = ({
  open,
  onClose,
  onRefresh,
  isLoading = false,
  error,
  onNavigateToLayer
}) => {
  const [layerGroups] = useAtom(layerGroupsAtom)
  const [selectedFeatures] = useAtom(selectedFeaturesForMapAtom)
  const setSelectedLineString = useSetAtom(setSelectedLineStringAtom)
  const toggleLayerVisibility = useSetAtom(toggleLayerVisibilityAtom)
  const toggleGroupVisibility = useSetAtom(toggleGroupVisibilityAtom)

  const stats = calculateLayerStats(layerGroups)

  const handleLayerClick = (layer: Layer, group: LayerGroup) => {
    // Tìm feature đầu tiên của layer để focus
    if (layer.geometry && layer.geometry.length > 0) {
      const firstGeometry = layer.geometry[0]
      
      // Tạo selectedLineString nếu là LineString
      if (firstGeometry.type === 'LineString') {
        const selectedLineString: SelectedLineString = {
          featureId: `${group.id}-${layer.id}-0`,
          layerId: layer.id,
          groupId: group.id,
          properties: firstGeometry.properties || {},
          geometry: {
            type: 'LineString',
            coordinates: firstGeometry.coordinates as number[][],
            properties: firstGeometry.properties || {}
          }
        }
        setSelectedLineString(selectedLineString)
      }
    }
  }

  const handleNavigateToLayer = (layer: Layer) => {
    if (!onNavigateToLayer || !layer.geometry || layer.geometry.length === 0) return

    // Tính toán bounds từ tất cả geometry của layer
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity

    layer.geometry.forEach(geom => {
      if (geom.coordinates && Array.isArray(geom.coordinates)) {
        const processCoordinates = (coords: number[] | number[][] | number[][][]) => {
          if (geom.type === 'Point') {
            // Point: coordinates là [lng, lat]
            const [lng, lat] = coords as number[]
            if (typeof lng === 'number' && typeof lat === 'number') {
              minLat = Math.min(minLat, lat)
              maxLat = Math.max(maxLat, lat)
              minLng = Math.min(minLng, lng)
              maxLng = Math.max(maxLng, lng)
            }
          } else if (geom.type === 'LineString') {
            // LineString: coordinates là [[lng, lat], [lng, lat], ...]
            const coordArray = coords as number[][]
            coordArray.forEach(([lng, lat]) => {
              if (typeof lng === 'number' && typeof lat === 'number') {
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                minLng = Math.min(minLng, lng)
                maxLng = Math.max(maxLng, lng)
              }
            })
          } else if (geom.type === 'Polygon') {
            // Polygon: coordinates là [[[lng, lat], [lng, lat], ...], ...]
            const rings = coords as number[][][]
            rings.forEach(ring => {
              ring.forEach(([lng, lat]) => {
                if (typeof lng === 'number' && typeof lat === 'number') {
                  minLat = Math.min(minLat, lat)
                  maxLat = Math.max(maxLat, lat)
                  minLng = Math.min(minLng, lng)
                  maxLng = Math.max(maxLng, lng)
                }
              })
            })
          }
        }

        processCoordinates(geom.coordinates)
      }
    })

    if (minLat !== Infinity && maxLat !== -Infinity && minLng !== Infinity && maxLng !== -Infinity) {
      // Bounds format cho Leaflet: [[south, west], [north, east]] = [[minLat, minLng], [maxLat, maxLng]]
      const bounds: [[number, number], [number, number]] = [
        [minLat, minLng],
        [maxLat, maxLng]
      ]
      onNavigateToLayer(bounds)
    }
  }



  if (!open) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 350,
        maxHeight: 'calc(100vh - 32px)',
        zIndex: 1000,
        animation: 'slideInFromRight 0.3s ease-out'
      }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 6,
          borderRadius: 2
        }}
      >
        <CardHeader
          title="Thống kê Layers"
          avatar={<Layers color="primary" />}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onRefresh && (
                <Tooltip title="Làm mới">
                  <IconButton
                    size="small"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Đóng">
                <IconButton
                  size="small"
                  onClick={onClose}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            pb: 1
          }}
        />

        <CardContent sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {isLoading && (
            <Box display="flex" justifyContent="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                Đang tải...
              </Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.contrastText">
                {error}
              </Typography>
            </Box>
          )}

          {!isLoading && !error && (
            <>
              {/* Thống kê tổng quan */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {stats.totalLayers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số layers
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {stats.totalFeatures}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số features
                    </Typography>
                  </Box>
                </Box>

                {/* Progress bar cho visible layers */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Layers hiển thị</Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {stats.visibleLayers}/{stats.totalLayers}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.totalLayers > 0 ? (stats.visibleLayers / stats.totalLayers) * 100 : 0}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>

                {/* Thống kê theo loại geometry */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${stats.lineStrings} LineString`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`${stats.polygons} Polygon`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`${stats.points} Point`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Danh sách layer groups */}
              {layerGroups.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Danh sách layer groups:
                  </Typography>
                  <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {layerGroups.map((group) => (
                      <Box key={group.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {group.name} ({group.layers.length} layers)
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => toggleGroupVisibility(group.id)}
                            sx={{ p: 0.5 }}
                          >
                            {group.visible ? (
                              <Visibility fontSize="small" color="action" />
                            ) : (
                              <VisibilityOff fontSize="small" color="action" />
                            )}
                          </IconButton>
                        </Box>
                        {group.layers.map((layer) => {
                          const layerFeatures = layer.geometry?.length || 0
                          const isSelected = selectedFeatures.some(f => f.layerId === layer.id)
                          
                          return (
                            <ListItemButton
                              key={layer.id}
                              sx={{
                                px: 1,
                                py: 0.5,
                                mb: 0.5,
                                borderRadius: 1,
                                border: isSelected ? '2px solid' : '1px solid transparent',
                                borderColor: isSelected ? 'primary.main' : 'transparent',
                                backgroundColor: isSelected ? 'primary.50' : 'transparent',
                                '&:hover': {
                                  backgroundColor: isSelected ? 'primary.100' : 'grey.50'
                                }
                              }}
                              onClick={() => handleLayerClick(layer, group)}
                            >
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <Assignment 
                                  color={isSelected ? 'primary' : 'action'} 
                                  fontSize="small" 
                                />
                              </ListItemIcon>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                                  {formatLayerName(layer.name)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={`${layerFeatures} features`}
                                    size="small"
                                    color="info"
                                    variant="filled"
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleLayerVisibility({ groupId: group.id, layerId: layer.id })
                                    }}
                                    sx={{ p: 0.5 }}
                                  >
                                    {layer.visible ? (
                                      <Visibility fontSize="small" color="action" />
                                    ) : (
                                      <VisibilityOff fontSize="small" color="action" />
                                    )}
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleNavigateToLayer(layer)
                                    }}
                                    sx={{ p: 0.5 }}
                                    title="Di chuyển đến vị trí layer"
                                  >
                                    <LocationOn fontSize="small" color="primary" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </ListItemButton>
                          )
                        })}
                      </Box>
                    ))}
                  </List>
                </>
              )}

              {layerGroups.length === 0 && !isLoading && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ py: 4 }}
                >
                  Chưa có layer nào được import
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
} 