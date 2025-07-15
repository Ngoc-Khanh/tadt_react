import type { UploadFile } from "@/hooks/useUploadFiles"
import { Box } from "@mui/material"
import { FileListItem } from "./file-list-item"

interface FileListProps {
  files: UploadFile[]
  onRemoveFile: (id: string) => void
  isImporting: boolean
}

export function FileList({ files, onRemoveFile, isImporting }: FileListProps) {
  return (
    <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
      {files.map((file) => (
        <FileListItem
          key={file.id}
          file={file}
          onRemove={() => onRemoveFile(file.id)}
          disabled={isImporting}
        />
      ))}
    </Box>
  )
}