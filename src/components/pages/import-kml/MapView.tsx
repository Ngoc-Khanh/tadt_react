import { CloudUpload, KeyboardArrowLeft, Layers, Map, Upload } from '@mui/icons-material'
import { Box, Button, Chip, Divider, IconButton, Paper, Tooltip, Typography, Badge } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { useState } from 'react'
import { 
  layerGroupsAtom, 
  showMapAtom, 
  successfulFilesAtom,
  packageAssignmentsAtom,
  showConfirmImportDialogActionAtom 
} from '../../../stores/importKMLAtoms'
import { LayerPanel } from './LayerPanel'
import { LeafletMap } from './LeafletMap'
import { PackageSelectionDialog } from './PackageSelectionDialog'
import { ConfirmImportDialog } from './ConfirmImportDialog'

export function MapView() {
  const [layerGroups] = useAtom(layerGroupsAtom)
  const [successfulFiles] = useAtom(successfulFilesAtom)
  const [packageAssignments] = useAtom(packageAssignmentsAtom)
  const setShowMap = useSetAtom(showMapAtom)
  const showConfirmImportDialog = useSetAtom(showConfirmImportDialogActionAtom)
  const [showLayerPanel, setShowLayerPanel] = useState(true)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)



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
              {packageAssignments.length > 0 && (
                <Chip
                  label={`${packageAssignments.length} Gói thầu đã gán`}
                  size="small"
                  color="warning"
                  variant="filled"
                />
              )}
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

          {/* Import to Map Button */}
          <Tooltip title="Import dữ liệu đã gán gói thầu vào bản đồ chính">
            <Badge 
              badgeContent={packageAssignments.length} 
              color="success" 
              showZero={false}
              max={99}
            >
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={packageAssignments.length === 0}
                sx={{
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    bgcolor: 'success.50'
                  },
                  '&:disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.400'
                  }
                }}
              >
                Import vào Map
              </Button>
            </Badge>
          </Tooltip>

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
          <Box sx={{ position: 'relative', height: '100%' }}>
            <LeafletMap
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

      {/* Package Selection Dialog */}
      <PackageSelectionDialog />

      {/* Confirm Import Dialog */}
      <ConfirmImportDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => {
          // Close dialog và navigate hoặc refresh
          setConfirmDialogOpen(false)
          showConfirmImportDialog()
          // Có thể navigate về mapSection hoặc thực hiện logic khác
        }}
        assignedPackages={packageAssignments.map(assignment => ({
          lineStringId: assignment.lineStringId.toString(),
          packageName: assignment.packageName,
          groupName: assignment.groupName,
          layerName: assignment.layerName
        }))}
      />
    </Box>
  )
} 