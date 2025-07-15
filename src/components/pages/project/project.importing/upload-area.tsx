import { FileListPanel } from "@/components/pages/project/project.importing/file-list-zone"
import { MapPreview } from "@/components/pages/project/project.importing/map-preview-zone"
import { UploadDropzone } from "@/components/pages/project/project.importing/upload-area-zone"
import { useUploadFiles } from "@/hooks/useUploadFiles"
import { Box } from "@mui/material"
import { useState } from "react"

export function UploadArea() {
  const [showMap, setShowMap] = useState(false)
  const uploadFiles = useUploadFiles()

  if (showMap) return <MapPreview onBack={() => setShowMap(false)} />

  return (
    <Box>
      {/* Upload Area */}
      <UploadDropzone onFilesAdded={uploadFiles.addFiles} />
      {/* File List */}
      {uploadFiles.files.length > 0 && (
        <FileListPanel
          files={uploadFiles.files}
          onRemoveFile={uploadFiles.removeFile}
          onClearAll={uploadFiles.clearAll}
          onImport={() => uploadFiles.importFiles().then(() => setShowMap(true))}
          isImporting={uploadFiles.isImporting}
        />
      )}
    </Box>
  )
}