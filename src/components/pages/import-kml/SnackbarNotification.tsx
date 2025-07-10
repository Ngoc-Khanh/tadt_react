import { Snackbar } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { hideSnackbarAtom, snackbarAtom } from '../../../stores/importKMLAtoms'

export function SnackbarNotification() {
  const [snackbar] = useAtom(snackbarAtom)
  const hideSnackbar = useSetAtom(hideSnackbarAtom)

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => hideSnackbar()}
      message={snackbar.message}
    />
  )
} 