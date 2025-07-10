import { Map } from '@mui/icons-material'
import { Fab, useMediaQuery, useTheme } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { pendingFilesAtom, showMapAtom, successfulFilesAtom } from '../../../stores/importKMLAtoms'

export function MobileFAB() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [successfulFiles] = useAtom(successfulFilesAtom)
  const [pendingFiles] = useAtom(pendingFilesAtom)
  const setShowMap = useSetAtom(showMapAtom)

  if (!isMobile || successfulFiles.length === 0) {
    return null
  }

  return (
    <Fab
      color="primary"
      aria-label="view map"
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      onClick={() => setShowMap(true)}
      disabled={pendingFiles.length > 0}
    >
      <Map />
    </Fab>
  )
} 