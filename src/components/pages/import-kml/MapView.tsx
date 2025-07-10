import { CloudUpload, KeyboardArrowLeft, Layers, Map } from '@mui/icons-material'
import { Box, Button, Chip, Divider, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { useState } from 'react'
import { layerGroupsAtom, showMapAtom, successfulFilesAtom } from '../../../stores/importKMLAtoms'
import { LayerPanel } from './LayerPanel'
import { LazyLeafletMap } from './LazyLeafletMap'

export function MapView() {
  const [layerGroups] = useAtom(layerGroupsAtom)
  const [successfulFiles] = useAtom(successfulFilesAtom)
  const setShowMap = useSetAtom(showMapAtom)
  const [showLayerPanel, setShowLayerPanel] = useState(true)

  // Tính tổng số features
  const totalFeatures = layerGroups.reduce((total, group) =>
    total + group.layers.reduce((layerTotal, layer) =>
      layerTotal + (layer.geometry?.length || 0), 0
    ), 0
  )

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'grey.50'
    }}>
      {/* Enhanced Header */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          m: 2,
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => setShowMap(false)}
            sx={{
              bgcolor: 'primary.50',
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.100' }
            }}
          >
            <KeyboardArrowLeft />
          </IconButton>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Map color="primary" />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                Bản đồ KML/KMZ
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<Layers />}
                label={`${layerGroups.length} Layer Groups`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${totalFeatures} Features`}
                size="small"
                color="success"
                variant="outlined"
              />
              <Chip
                label={`${successfulFiles.length} Files`}
                size="small"
                color="info"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={showLayerPanel ? 'Ẩn bảng điều khiển layer' : 'Hiển thị bảng điều khiển layer'}>
            <Button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              startIcon={<Layers />}
              variant={showLayerPanel ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                minWidth: 'auto',
                ...(showLayerPanel ? {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                } : {
                  borderColor: 'grey.300',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                })
              }}
            >
              {showLayerPanel ? 'Ẩn' : 'Layers'}
            </Button>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setShowMap(false)}
            sx={{
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Import thêm
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        gap: 2,
        px: 2,
        pb: 2,
        height: '750px',
        minHeight: 0
      }}>
        {/* Map Area */}
        <Paper
          elevation={2}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            transition: 'margin-right 0.3s ease-in-out',
            marginRight: showLayerPanel ? 0 : 0
          }}
        >
          {layerGroups.length > 0 ? (
            <Box sx={{ position: 'relative', height: '100%' }}>
              <LazyLeafletMap
                layerGroups={layerGroups}
                height="100%"
                onLayoutChange={showLayerPanel}
              />

              {/* Floating Layer Toggle - only show when panel is hidden and we have layers */}
              {!showLayerPanel && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1000,
                    animation: 'slideInFromRight 0.3s ease-out'
                  }}
                >
                  <Tooltip title="Hiển thị bảng điều khiển layers">
                    <Button
                      onClick={() => setShowLayerPanel(true)}
                      variant="contained"
                      size="small"
                      startIcon={<Layers />}
                      sx={{
                        borderRadius: 2,
                        boxShadow: 3,
                        bgcolor: 'primary.main',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: 4,
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Layers ({layerGroups.length})
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
                minHeight: '500px',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}
            >
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: 'primary.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <Map sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>

                <Typography variant="h4" gutterBottom fontWeight="bold" color="text.primary">
                  Bản đồ tương tác
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  Powered by Leaflet & CARTO
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                  Chưa có dữ liệu để hiển thị. Hãy import file KML/KMZ để xem bản đồ với các layer địa lý.
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => setShowMap(false)}
                  sx={{
                    mt: 3,
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Import File KML/KMZ
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Layers Panel */}
        <Box
          sx={{
            width: showLayerPanel ? 380 : 0,
            transition: 'width 0.3s ease-in-out',
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          <Box
            sx={{
              width: 380,
              opacity: showLayerPanel ? 1 : 0,
              transform: showLayerPanel ? 'translateX(0)' : 'translateX(100%)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <LayerPanel />
          </Box>
        </Box>
      </Box>
    </Box>
  )
} 