import {
  layerGroupsAtom,
  toggleLayerGroupVisibilityAtom,
  toggleLayerVisibilityAtom
} from '@/stores/importKMLAtoms'
import { Layers, Visibility, VisibilityOff, Info } from '@mui/icons-material'
import {
  Alert,
  Box,
  Card,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Switch,
  Typography,
  Tooltip
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'

export function LayerPanel() {
  const [layerGroups] = useAtom(layerGroupsAtom)
  const toggleLayerGroupVisibility = useSetAtom(toggleLayerGroupVisibilityAtom)
  const toggleLayerVisibility = useSetAtom(toggleLayerVisibilityAtom)

  // Tính tổng số features
  const totalFeatures = layerGroups.reduce((total, group) => 
    total + group.layers.reduce((layerTotal, layer) => 
      layerTotal + (layer.geometry?.length || 0), 0
    ), 0
  )

  const visibleGroups = layerGroups.filter(group => group.visible).length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper 
        elevation={2} 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          height: '100%'
        }}
      >
        {/* Enhanced Header */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Quản lý Layers
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Điều khiển hiển thị các layer
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${layerGroups.length} Groups`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'medium'
              }}
            />
            <Chip 
              label={`${visibleGroups} Visible`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'medium'
              }}
            />
            <Chip 
              label={`${totalFeatures} Features`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'medium'
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {layerGroups.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Chưa có layer nào. Hãy import file KML/KMZ để bắt đầu.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {layerGroups.map((group) => (
                <Card key={group.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Switch
                        checked={group.visible}
                        onChange={() => toggleLayerGroupVisibility(group.id)}
                        size="small"
                        color="primary"
                      />
                      <Box sx={{ ml: 1, flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {group.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {group.layers.length} layer(s)
                        </Typography>
                      </Box>
                    </Box>
                    
                    <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 0 }}>
                      {group.layers.map((layer) => (
                        <ListItem 
                          key={layer.id} 
                          sx={{ 
                            py: 1,
                            px: 2,
                            '&:hover': { bgcolor: 'grey.100' },
                            borderRadius: 1,
                            mb: 0.5
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                bgcolor: layer.color,
                                borderRadius: '50%',
                                border: '2px solid white',
                                boxShadow: 2
                              }}
                            />
                          </ListItemIcon>
                          
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {layer.name}
                                </Typography>
                                {layer.geometry && layer.geometry.length > 0 && (
                                  <Chip 
                                    label={layer.geometry.length}
                                    size="small"
                                    sx={{ 
                                      height: 18,
                                      fontSize: '0.7rem',
                                      bgcolor: 'primary.50',
                                      color: 'primary.main'
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              layer.bounds && (
                                <Typography variant="caption" color="text.secondary">
                                  Bounds: {layer.bounds[0][0].toFixed(4)}, {layer.bounds[0][1].toFixed(4)}
                                </Typography>
                              )
                            }
                          />
                          
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {layer.geometry && layer.geometry.length > 0 && (
                                <Tooltip title={`${layer.geometry.length} features - Click để xem chi tiết`}>
                                  <IconButton size="small" sx={{ color: 'info.main' }}>
                                    <Info fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title={layer.visible ? 'Ẩn layer' : 'Hiện layer'}>
                                <IconButton
                                  size="small"
                                  onClick={() => toggleLayerVisibility(group.id, layer.id)}
                                  sx={{
                                    color: layer.visible ? 'primary.main' : 'text.disabled'
                                  }}
                                >
                                  {layer.visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  )
} 