import type { UploadFile } from "@/hooks/useUploadFiles"
import { Check, Error as ErrorIcon, Schedule } from "@mui/icons-material"
import { Avatar, CircularProgress } from "@mui/material"

interface FileStatusIconProps {
  status: UploadFile['status']
}

export function FileStatusIcon({ status }: FileStatusIconProps) {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <Check />
      case 'error':
        return <ErrorIcon />
      case 'processing':
        return <CircularProgress size={20} />
      default:
        return <Schedule />
    }
  }

  const getColor = () => {
    switch (status) {
      case 'success': return 'success.main'
      case 'error': return 'error.main'
      case 'processing': return 'primary.main'
      default: return 'grey.500'
    }
  }

  const getBgColor = () => {
    switch (status) {
      case 'success': return 'success.100'
      case 'error': return 'error.100'
      case 'processing': return 'primary.100'
      default: return 'grey.100'
    }
  }

  return (
    <Avatar
      sx={{
        width: 32,
        height: 32,
        color: getColor(),
        bgcolor: getBgColor(),
        '& .MuiSvgIcon-root': {
          fontSize: 18
        }
      }}
    >
      {getIcon()}
    </Avatar>
  )
}