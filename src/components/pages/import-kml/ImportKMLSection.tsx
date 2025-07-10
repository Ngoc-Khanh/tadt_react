import { showMapAtom } from '@/stores/importKMLAtoms'
import { Box, Typography } from '@mui/material'
import { useAtom } from 'jotai'
import { FileList } from './FileList'
import { MapView } from './MapView'
import { MobileFAB } from './MobileFAB'
import { SnackbarNotification } from './SnackbarNotification'
import { StatsPanel } from './StatsPanel'
import { UploadArea } from './UploadArea'

export function ImportKMLSection() {
  const [showMap] = useAtom(showMapAtom)

  if (showMap) {
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

            {/* Upload Area */}
            <UploadArea />

            {/* Files Section */}
            <FileList />
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