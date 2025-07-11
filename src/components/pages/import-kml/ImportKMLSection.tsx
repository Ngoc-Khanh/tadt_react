import { showMapAtom, canViewMapAtom, selectedProjectAtom, successfulFilesAtom, showMapWithFitBoundsAtom } from '@/stores/importKMLAtoms'
import { Box, Typography, Alert, Button } from '@mui/material'
import { Map } from '@mui/icons-material'
import { useAtom, useSetAtom } from 'jotai'
import { FileList } from './FileList'
import { MapView } from './MapView'
import { MobileFAB } from './MobileFAB'
import { SnackbarNotification } from './SnackbarNotification'
import { StatsPanel } from './StatsPanel'
import { UploadArea } from './UploadArea'

export function ImportKMLSection() {
  const [showMap] = useAtom(showMapAtom)
  const [canViewMap] = useAtom(canViewMapAtom)
  const [selectedProject] = useAtom(selectedProjectAtom)
  const [successfulFiles] = useAtom(successfulFilesAtom)
  const showMapWithFitBounds = useSetAtom(showMapWithFitBoundsAtom)

  if (showMap && canViewMap) {
    return (
      <>
        <MapView />
        <SnackbarNotification />
      </>
    )
  }

  return (
    <Box sx={{ height: '100%', p: 3 }}>
      <Box sx={{ height: '100%', display: 'flex', gap: 3 }}>
        <Box sx={{ flex: '1 1 70%' }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Import KML/KMZ Files
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tải lên các file KML hoặc KMZ để hiển thị trên bản đồ
              </Typography>
            </Box>

            {/* Status Alert */}
            {!canViewMap && (
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
              >
                <Typography variant="body2">
                  {!selectedProject && !successfulFiles.length && (
                    "Vui lòng chọn dự án bên phải và upload file KML/KMZ để xem bản đồ"
                  )}
                  {!selectedProject && successfulFiles.length > 0 && (
                    "Vui lòng chọn dự án bên phải để xem bản đồ"
                  )}
                  {selectedProject && !successfulFiles.length && (
                    "Vui lòng upload file KML/KMZ để xem bản đồ"
                  )}
                </Typography>
              </Alert>
            )}

            {/* Upload Area */}
            <UploadArea />

            {/* Files Section */}
            <FileList />
            
            {/* View Map Button - Bottom Action */}
            {canViewMap && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Map />}
                  onClick={() => showMapWithFitBounds()}
                  sx={{ 
                    minWidth: 200,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2
                    }
                  }}
                >
                  Xem bản đồ
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Stats Panel */}
        <StatsPanel />
      </Box>

      {/* Mobile FAB */}
      <MobileFAB />

      {/* Snackbar */}
      <SnackbarNotification />
    </Box>
  )
} 