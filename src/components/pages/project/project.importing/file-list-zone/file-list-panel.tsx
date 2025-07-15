import type { UploadFile } from "@/hooks/useUploadFiles"
import { Paper } from "@mui/material"
import { FileListActions } from "./file-list-actions"
import { FileListHeader } from "./file-list-header"
import { FileList } from "./file-list"

interface FileListPanelProps {
  files: UploadFile[]
  onRemoveFile: (id: string) => void
  onClearAll: () => void
  onImport: () => void
  isImporting: boolean
}

export function FileListPanel({ files, onRemoveFile, onClearAll, onImport, isImporting }: FileListPanelProps) {
  const hasFiles = files.length > 0
  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length

  if (!hasFiles) return null

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 3,
        overflow: 'hidden'
      }}
    >
      <FileListHeader
        totalFiles={files.length}
        successCount={successCount}
        errorCount={errorCount}
        onClearAll={onClearAll}
        isImporting={isImporting}
      />

      <FileList
        files={files}
        onRemoveFile={onRemoveFile}
        isImporting={isImporting}
      />

      <FileListActions
        files={files}
        onImport={onImport}
        isImporting={isImporting}
      />
    </Paper>
  )
}