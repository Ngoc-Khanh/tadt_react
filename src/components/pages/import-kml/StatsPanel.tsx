import { EStatus } from '@/constants/enums'
import type { IMapResponse } from '@/constants/interfaces'
import { useProjects } from '@/hooks/useProjects'
import { selectedProjectAtom, setSelectedProjectAtom } from '@/stores/importKMLAtoms'
import { 
  Assignment, 
  Refresh,
  TrendingUp,
  Schedule,
  CheckCircle,
  Cancel,
  Pause,
  PendingActions,
  RadioButtonUnchecked,
  RadioButtonChecked
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItemIcon,
  ListItemButton,
  Typography,
  Alert
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'

export function StatsPanel() {
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useProjects()
  
  const [selectedProject] = useAtom(selectedProjectAtom)
  const setSelectedProject = useSetAtom(setSelectedProjectAtom)

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  return (
    <Box sx={{ flex: '0 0 30%' }}>
      <Card>
        <CardHeader 
          title="Danh sách dự án" 
          avatar={<Assignment color="primary" />}
          action={
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Làm mới
            </Button>
          }
        />
        <CardContent>
          {isLoading && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Không thể tải danh sách dự án
            </Alert>
          )}

          {!isLoading && !error && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" color="primary.main" fontWeight="bold">
                  {projects.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số dự án
                </Typography>
              </Box>

              {projects.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Chọn dự án để xem bản đồ:
                  </Typography>
                  <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {projects.map((project: IMapResponse) => {
                      const isSelected = selectedProject?.project_id === project.project_id
                      return (
                        <ListItemButton 
                          key={project.project_id} 
                          sx={{ 
                            px: 0, 
                            pb: 2, 
                            alignItems: 'flex-start',
                            borderRadius: 1,
                            border: isSelected ? '2px solid' : '1px solid transparent',
                            borderColor: isSelected ? 'primary.main' : 'transparent',
                            backgroundColor: isSelected ? 'primary.50' : 'transparent',
                            mb: 1,
                            '&:hover': {
                              backgroundColor: isSelected ? 'primary.100' : 'grey.50'
                            }
                          }}
                          onClick={() => setSelectedProject(project)}
                        >
                          <ListItemIcon sx={{ mt: 0.5, minWidth: 32 }}>
                            {isSelected ? (
                              <RadioButtonChecked color="primary" fontSize="small" />
                            ) : (
                              <RadioButtonUnchecked color="action" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemIcon sx={{ mt: 0.5, minWidth: 32 }}>
                            {getStatusIcon(project.trang_thai)}
                          </ListItemIcon>
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              component="div"
                              fontWeight={isSelected ? 'bold' : 'normal'}
                            >
                              {project.ten_du_an}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Chip 
                                label={project.trang_thai}
                                size="small"
                                color={getStatusColor(project.trang_thai)}
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                <Schedule fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                {formatDate(project.ngay_cap_nhat)}
                              </Typography>
                            </Box>
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption">Tiến độ thực tế</Typography>
                                <Typography variant="caption" fontWeight="bold">
                                  {project.tien_do_thuc_te}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={project.tien_do_thuc_te}
                                sx={{ height: 6, borderRadius: 1 }}
                              />
                            </Box>
                          </Box>
                        </ListItemButton>
                      )
                    })}
                  </List>
                </>
              )}

              {projects.length === 0 && !isLoading && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  textAlign="center"
                  sx={{ py: 2 }}
                >
                  Không có dự án nào
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
} 