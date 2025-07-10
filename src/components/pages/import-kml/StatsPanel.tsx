import {
  layerGroupsAtom,
  pendingFilesAtom,
  showMapAtom,
  successfulFilesAtom
} from '@/stores/importKMLAtoms'
import { Layers, Map } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'

export function StatsPanel() {
  const [successfulFiles] = useAtom(successfulFilesAtom)
  const [pendingFiles] = useAtom(pendingFilesAtom)
  const [layerGroups] = useAtom(layerGroupsAtom)
  const setShowMap = useSetAtom(showMapAtom)

  return (
    <Box sx={{ flex: '0 0 30%' }}>
      <Card>
        <CardHeader title="Thống kê" avatar={<Map color="primary" />} />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" color="primary.main" fontWeight="bold">
              {successfulFiles.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              File thành công
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {pendingFiles.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              File đang xử lý
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {layerGroups.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhóm layer
            </Typography>
          </Box>

          {successfulFiles.length > 0 && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Map />}
              onClick={() => setShowMap(true)}
              disabled={pendingFiles.length > 0}
            >
              Xem bản đồ
            </Button>
          )}
        </CardContent>
      </Card>

      {layerGroups.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardHeader title="Preview Layers" />
          <CardContent sx={{ pt: 0 }}>
            <List dense>
              {layerGroups.slice(0, 3).map((group) => (
                <ListItem key={group.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Layers fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={group.name}
                    secondary={`${group.layers.length} layer(s)`}
                  />
                </ListItem>
              ))}
              {layerGroups.length > 3 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary={`+${layerGroups.length - 3} nhóm khác...`}
                    sx={{ fontStyle: 'italic' }}
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  )
} 