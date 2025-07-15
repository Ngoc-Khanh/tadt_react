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
  LocationOn,
  Delete
} from '@mui/icons-material'
import { useAtom, useSetAtom } from 'jotai'
import { 
  layerGroupsAtom, 
  selectedFeaturesForMapAtom,
  setSelectedLineStringAtom,
  toggleLayerVisibilityAtom,
  toggleGroupVisibilityAtom,
  removeLayerAtom
} from '@/stores/importKMLAtoms'
import type { LayerGroup, SelectedLineString, Layer } from '@/stores/importKMLAtoms'

interface LayerStatsPanelProps {
  open: boolean
  onClose: () => void
  onRefresh?: () => void
  isLoading?: boolean
  error?: string
  onNavigateToLayer?: (bounds: [[number, number], [number, number]]) => void
  isFullPanel?: boolean // Thêm prop để xác định xem có phải full panel không
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

export const LayerStatsPanel: React.FC<LayerStatsPanelProps> = React.memo(({
  open,
  onClose,
  onRefresh,
  isLoading = false,
  error,
  onNavigateToLayer,
  isFullPanel = false
}) => {
  const [layerGroups] = useAtom(layerGroupsAtom)
  const [selectedFeatures] = useAtom(selectedFeaturesForMapAtom)
  const setSelectedLineString = useSetAtom(setSelectedLineStringAtom)
  const toggleLayerVisibility = useSetAtom(toggleLayerVisibilityAtom)
  const toggleGroupVisibility = useSetAtom(toggleGroupVisibilityAtom)
  const removeLayer = useSetAtom(removeLayerAtom)

  // Memoize stats calculation để tránh re-calculation không cần thiết
  const stats = React.useMemo(() => calculateLayerStats(layerGroups), [layerGroups])

  const handleLayerClick = React.useCallback((layer: Layer, group: LayerGroup) => {
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
  }, [setSelectedLineString])

  const handleNavigateToLayer = React.useCallback((layer: Layer) => {
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
  }, [onNavigateToLayer])

  if (!open) return null

  // Nếu là full panel mode, không cần container wrapper
  if (isFullPanel) {
    return (
      <Card
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          boxShadow: 'none',
          border: 'none',
          overflow: 'hidden'
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
            pb: 1,
            bgcolor: 'grey.50'
          }}
        />

        <CardContent sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 0,
          he
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: 0 }
        }}>
          <Box sx={{ p: 2, flex: 1 }}>
            {/* Nội dung giống như version overlay nhưng đã được render ở trên */}
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
                    <List dense sx={{ 
                      flex: 1,
                      overflow: 'auto',
                      pr: 1,
                      '&::-webkit-scrollbar': {
                        width: 6
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'grey.100',
                        borderRadius: 3
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'grey.400',
                        borderRadius: 3,
                        '&:hover': {
                          backgroundColor: 'grey.600'
                        }
                      }
                    }}>
                      {layerGroups.map((group) => (
                        <Box key={group.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {group.name} ({group.layers.length} layers)
                            </Typography>
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
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                    <Chip
                                      label={`${layerFeatures} features`}
                                      size="small"
                                      color="info"
                                      variant="filled"
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (window.confirm(`Bạn có chắc chắn muốn xóa layer "${layer.name}"?`)) {
                                            removeLayer({ groupId: group.id, layerId: layer.id })
                                          }
                                        }}
                                        sx={{ p: 0.5 }}
                                        title="Xóa layer"
                                      >
                                        <Delete fontSize="small" color="error" />
                                      </IconButton>
                                    </Box>
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
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Overlay mode (existing code) - Cải thiện với bo góc
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        bottom: 16,
        width: 400,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 1000,
        animation: 'slideInFromRight 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Card
        sx={{
          height: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          borderRadius: 4,
          overflow: 'hidden',
          border: '2px solid white',
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(255, 255, 255, 0.95)'
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
                    sx={{
                      '&:hover': {
                        transform: 'scale(1.1)',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Đóng">
                <IconButton
                  size="small"
                  onClick={onClose}
                  sx={{
                    '&:hover': {
                      transform: 'scale(1.1)',
                      bgcolor: 'error.light',
                      color: 'error.dark'
                    }
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            pb: 1,
            bgcolor: 'rgba(25, 118, 210, 0.08)',
            '& .MuiCardHeader-title': {
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'primary.main'
            }
          }}
        />

        <CardContent sx={{ 
          flex: 1, 
          overflow: 'hidden',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: 0 }
        }}>
          <Box sx={{ p: 2, flex: 1, overflow: 'auto', minHeight: 0 }}>
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
                    <Box
                      sx={{
                        maxHeight: 320, // hoặc điều chỉnh cho phù hợp UI
                        overflow: 'auto',
                        pr: 1,
                        mb: 2,
                        '&::-webkit-scrollbar': {
                          width: 6
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'grey.100',
                          borderRadius: 3
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'grey.400',
                          borderRadius: 3,
                          '&:hover': {
                            backgroundColor: 'grey.600'
                          }
                        }
                      }}
                    >
                      <List dense>
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                      <Chip
                                        label={`${layerFeatures} features`}
                                        size="small"
                                        color="info"
                                        variant="filled"
                                      />
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (window.confirm(`Bạn có chắc chắn muốn xóa layer "${layer.name}"?`)) {
                                              removeLayer({ groupId: group.id, layerId: layer.id })
                                            }
                                          }}
                                          sx={{ p: 0.5 }}
                                          title="Xóa layer"
                                        >
                                          <Delete fontSize="small" color="error" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </Box>
                                </ListItemButton>
                              )
                            })}
                          </Box>
                        ))}
                      </List>
                    </Box>
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}) 