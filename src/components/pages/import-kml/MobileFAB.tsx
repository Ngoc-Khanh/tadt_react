import { Map } from '@mui/icons-material'
import { Fab, useMediaQuery, useTheme } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { pendingFilesAtom, showMapWithFitBoundsAtom, canViewMapAtom } from '../../../stores/importKMLAtoms'

export function MobileFAB() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [canViewMap] = useAtom(canViewMapAtom)
  const [pendingFiles] = useAtom(pendingFilesAtom)
  const showMapWithFitBounds = useSetAtom(showMapWithFitBoundsAtom)

  if (!isMobile || !canViewMap) {
    return null
  }

  return (
    <Fab
      color="primary"
      aria-label="view map"
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      onClick={() => showMapWithFitBounds()}
      disabled={pendingFiles.length > 0}
    >
      <Map />
    </Fab>
  )
} 