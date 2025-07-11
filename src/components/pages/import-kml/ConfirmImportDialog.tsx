import {
  CheckCircle,
  Close,
  Map,
  Assignment,
  Upload,
  Warning
} from '@mui/icons-material'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Alert
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import {
  layerGroupsAtom,
  selectedProjectAtom,
  successfulFilesAtom,
  confirmImportToMapAtom,
  clearImportDataAtom,
  snackbarAtom
} from '@/stores/importKMLAtoms'
import { useSaveAssignments } from '@/hooks/useImportedData'
import { useTabNavigation } from '@/contexts/TabContext'

interface ConfirmImportDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  assignedPackages: Array<{
    lineStringId: string
    packageName: string
    groupName: string
    layerName: string
  }>
}

export function ConfirmImportDialog({ 
  open, 
  onClose, 
  onConfirm, 
  assignedPackages 
}: ConfirmImportDialogProps) {
  const [layerGroups] = useAtom(layerGroupsAtom)
  const [selectedProject] = useAtom(selectedProjectAtom)
  const [successfulFiles] = useAtom(successfulFilesAtom)
  
  const confirmImportData = useSetAtom(confirmImportToMapAtom)
  const clearImportData = useSetAtom(clearImportDataAtom)
  const showSnackbar = useSetAtom(snackbarAtom)
  const { navigateToMap } = useTabNavigation()
  
  const saveAssignments = useSaveAssignments()

  // Tính tổng số features
  const totalFeatures = layerGroups.reduce((total, group) =>
    total + group.layers.reduce((layerTotal, layer) =>
      layerTotal + (layer.geometry?.length || 0), 0
    ), 0
  )

  const totalAssignments = assignedPackages.length
  const unassignedFeatures = totalFeatures - totalAssignments

  const handleConfirm = async () => {
    try {
      // Get import data from atom
      const importData = confirmImportData()
      
      if (!importData) {
        showSnackbar({ open: true, message: 'Không thể lấy dữ liệu import!' })
        return
      }

      // Call API to save assignments
      await saveAssignments.mutateAsync(importData)
      
      // Clear import data
      clearImportData()
      
      // Show success message
      showSnackbar({ 
        open: true, 
        message: `Đã import ${totalAssignments} gói thầu vào bản đồ chính thành công!` 
      })
      
      // Navigate to map tab
      setTimeout(() => {
        navigateToMap()
      }, 1000) // Delay để user thấy success message
      
      // Call parent onConfirm
      onConfirm()
      
    } catch (error) {
      console.error('[ConfirmImportDialog] Error importing data:', error)
      showSnackbar({ open: true, message: 'Lỗi khi import dữ liệu! Vui lòng thử lại.' })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Map color="primary" />
          <Typography variant="h5" component="div" fontWeight="bold" color="primary.main">
            Xác nhận import vào bản đồ chính
          </Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {/* Project Info */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.50', 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: 'primary.200',
          mb: 3
        }}>
          <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
            Thông tin dự án
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Tên dự án:</strong> {selectedProject?.ten_du_an || 'Chưa chọn'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {selectedProject?.project_id || 'N/A'}
          </Typography>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'success.50', 
            borderRadius: 2,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'success.200'
          }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {successfulFiles.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Files KML/KMZ
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: 'info.50', 
            borderRadius: 2,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'info.200'
          }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {totalFeatures}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tổng Features
            </Typography>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.50', 
            borderRadius: 2,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {totalAssignments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gói thầu đã gán
            </Typography>
          </Box>
        </Box>

        {/* Warning for unassigned features */}
        {unassignedFeatures > 0 && (
          <Alert 
            severity="warning" 
            icon={<Warning />}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              <strong>Cảnh báo:</strong> Còn {unassignedFeatures} feature(s) chưa được gán gói thầu. 
              Những feature này sẽ được import nhưng không có thông tin gói thầu.
            </Typography>
          </Alert>
        )}

        {/* Assigned Packages List */}
        {assignedPackages.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              Danh sách gói thầu đã gán ({assignedPackages.length})
            </Typography>
            
            <List sx={{ 
              maxHeight: 300, 
              overflow: 'auto',
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.300'
            }}>
              {assignedPackages.map((assignment, index) => (
                <ListItem key={index} divider={index < assignedPackages.length - 1}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {assignment.packageName}
                        </Typography>
                        <Chip
                          label={assignment.groupName}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Layer: {assignment.layerName} • LineString: {assignment.lineStringId}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* No assignments message */}
        {assignedPackages.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Chưa có gói thầu nào được gán. Dữ liệu sẽ được import mà không có thông tin gói thầu.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Hủy
        </Button>
        
        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={<Upload />}
          disabled={saveAssignments.isPending}
          sx={{ 
            borderRadius: 2,
            minWidth: 160
          }}
        >
          {saveAssignments.isPending ? 'Đang import...' : 'Import vào bản đồ chính'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 