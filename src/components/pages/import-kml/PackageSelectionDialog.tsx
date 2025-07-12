import {
  Assignment,
  Close,
  CheckCircle,
  TrendingUp,
  Cancel,
  Pause,
  PendingActions,
  RadioButtonUnchecked,
  RadioButtonChecked
} from '@mui/icons-material'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import {
  showPackageSelectionDialogAtom,
  selectedLineStringAtom,
  selectedPackageAtom,
  closePackageSelectionDialogAtom,
  assignPackageToLineStringAtom
} from '../../../stores/importKMLAtoms'
import { usePackages } from '../../../hooks/usePackages'
import { EStatus } from '../../../constants/enums'
import type { IPackageResponse } from '../../../constants/interfaces'

export function PackageSelectionDialog() {
  const [open] = useAtom(showPackageSelectionDialogAtom)
  const [selectedLineString] = useAtom(selectedLineStringAtom)
  const [selectedPackage] = useAtom(selectedPackageAtom)
  
  const setSelectedPackage = useSetAtom(selectedPackageAtom)
  const closeDialog = useSetAtom(closePackageSelectionDialogAtom)
  const assignPackage = useSetAtom(assignPackageToLineStringAtom)
  
  const {
    data: packages = [],
    isLoading,
    error,
    refetch
  } = usePackages()

  const getStatusColor = (status: string): 'success' | 'primary' | 'error' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case EStatus.COMPLETED:
        return 'success'
      case EStatus.ACTIVE:
        return 'primary'
      case EStatus.CANCELLED:
        return 'error'
      case EStatus.PAUSED:
        return 'warning'
      case EStatus.PENDING:
      case EStatus.PROCESSING:
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case EStatus.COMPLETED:
        return <CheckCircle fontSize="small" />
      case EStatus.ACTIVE:
        return <TrendingUp fontSize="small" />
      case EStatus.CANCELLED:
        return <Cancel fontSize="small" />
      case EStatus.PAUSED:
        return <Pause fontSize="small" />
      case EStatus.PENDING:
      case EStatus.PROCESSING:
        return <PendingActions fontSize="small" />
      default:
        return <Assignment fontSize="small" />
    }
  }

  const handlePackageSelect = (packageData: IPackageResponse) => {
    setSelectedPackage(packageData)
  }

  const handleAssign = () => {
    assignPackage()
  }

  const handleClose = () => {
    closeDialog()
  }

  const canAssign = selectedPackage && selectedLineString

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold" color="primary.main">
            Chọn gói thầu
          </Typography>
          {selectedLineString && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              LineString: {selectedLineString.featureId}
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} edge="end">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2 }}>
        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Thử lại
              </Button>
            }
            sx={{ mb: 2 }}
          >
            Lỗi khi tải danh sách gói thầu: {error.message}
          </Alert>
        )}

        {/* Package List */}
        {!isLoading && !error && packages.length > 0 && (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {packages.map((pkg) => (
              <ListItem key={pkg.package_id} disablePadding>
                <ListItemButton
                  onClick={() => handlePackageSelect(pkg)}
                  selected={selectedPackage?.package_id === pkg.package_id}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: selectedPackage?.package_id === pkg.package_id 
                      ? '2px solid' 
                      : '1px solid',
                    borderColor: selectedPackage?.package_id === pkg.package_id 
                      ? 'primary.main' 
                      : 'grey.300',
                    bgcolor: selectedPackage?.package_id === pkg.package_id 
                      ? 'primary.50' 
                      : 'background.paper',
                    '&:hover': {
                      bgcolor: selectedPackage?.package_id === pkg.package_id 
                        ? 'primary.100' 
                        : 'grey.50'
                    }
                  }}
                >
                  <ListItemIcon>
                    {selectedPackage?.package_id === pkg.package_id ? (
                      <RadioButtonChecked color="primary" />
                    ) : (
                      <RadioButtonUnchecked color="action" />
                    )}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {pkg.ten_goi_thau}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(pkg.trang_thai)}
                          label={pkg.trang_thai}
                          size="small"
                          color={getStatusColor(pkg.trang_thai)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          ID: {pkg.package_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                          Tiến độ: {pkg.tien_do_thuc_te}%
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {/* Empty State */}
        {!isLoading && !error && packages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Assignment sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Không có gói thầu nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hiện tại chưa có gói thầu nào trong hệ thống
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Hủy
        </Button>
        
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!canAssign}
          sx={{ 
            borderRadius: 2,
            minWidth: 120
          }}
        >
          {selectedPackage ? `Gán "${selectedPackage.ten_goi_thau}"` : 'Chọn gói thầu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 