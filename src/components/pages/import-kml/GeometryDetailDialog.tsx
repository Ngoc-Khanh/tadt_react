import {
  Clear,
  CopyAll,
  CropLandscape,
  ExpandMore,
  Layers,
  LocationOn,
  PinDrop,
  Search,
  Timeline
} from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Pagination,
  CircularProgress
} from '@mui/material'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import type { GeometryData, LayerData } from '@/stores/importKMLAtoms'

interface GeometryDetailDialogProps {
  open: boolean
  onClose: () => void
  layer: LayerData | null
}

// Số items mỗi trang để tránh lag
const ITEMS_PER_PAGE = 10

// Hook debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Icon cho từng loại geometry
const getGeometryIcon = (type: string) => {
  switch (type) {
    case 'Point':
      return <PinDrop sx={{ fontSize: 20 }} />
    case 'LineString':
      return <Timeline sx={{ fontSize: 20 }} />
    case 'Polygon':
      return <CropLandscape sx={{ fontSize: 20 }} />
    case 'MultiPolygon':
      return <Layers sx={{ fontSize: 20 }} />
    default:
      return <LocationOn sx={{ fontSize: 20 }} />
  }
}

// Tính toán đơn giản center point
const getSimpleCenter = (geom: GeometryData): string => {
  try {
    if (geom.type === 'Point') {
      const coords = geom.coordinates as number[]
      return `${coords[1]?.toFixed(4) || 0}, ${coords[0]?.toFixed(4) || 0}`
    } else if (geom.type === 'LineString') {
      const coords = geom.coordinates as number[][]
      if (coords.length > 0) {
        const first = coords[0]
        return `${first[1]?.toFixed(4) || 0}, ${first[0]?.toFixed(4) || 0}`
      }
    } else if (geom.type === 'Polygon') {
      const coords = geom.coordinates as number[][][]
      if (coords[0] && coords[0].length > 0) {
        const first = coords[0][0]
        return `${first[1]?.toFixed(4) || 0}, ${first[0]?.toFixed(4) || 0}`
      }
    }
    return '0, 0'
  } catch {
    return '0, 0'
  }
}

// Lấy số điểm đơn giản
const getPointCount = (geom: GeometryData): string => {
  try {
    switch (geom.type) {
      case 'Point':
        return '1 điểm'
      case 'LineString': {
        const coords = geom.coordinates as number[][]
        return `${coords.length} điểm`
      }
      case 'Polygon': {
        const coords = geom.coordinates as number[][][]
        return `${coords[0]?.length || 0} điểm`
      }
      case 'MultiPolygon': {
        const coords = geom.coordinates as unknown as number[][][][]
        const total = coords.reduce((sum, poly) => sum + (poly[0]?.length || 0), 0)
        return `${total} điểm`
      }
      default:
        return '0 điểm'
    }
  } catch {
    return '0 điểm'
  }
}

// Copy to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Component con cho Properties Table
const PropertiesTable = React.memo<{ properties?: Record<string, string | number | boolean> }>(({ properties }) => {
  if (!properties || Object.keys(properties).length === 0) return null

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Thuộc tính
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Giá trị</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 50 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(properties).slice(0, 10).map(([key, value]) => (
                <TableRow key={key} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{key}</TableCell>
                  <TableCell>{String(value)}</TableCell>
                  <TableCell>
                    <Tooltip title="Copy giá trị">
                      <IconButton 
                        size="small"
                        onClick={() => copyToClipboard(String(value))}
                      >
                        <CopyAll fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
})

// Component con cho Geometry Info
const GeometryInfo = React.memo<{ 
  geometry: GeometryData
  center: string
  pointCount: string
}>(({ geometry, center, pointCount }) => {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Thông tin Geometry
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Loại</Typography>
            <Typography variant="body2" fontWeight="medium">{geometry.type}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Center Point</Typography>
            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
              {center}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Số điểm</Typography>
            <Typography variant="body2" fontWeight="medium">{pointCount}</Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<CopyAll />}
            onClick={() => copyToClipboard(center)}
          >
            Copy Center
          </Button>
          <Button
            size="small"
            startIcon={<CopyAll />}
            onClick={() => copyToClipboard(JSON.stringify(geometry.coordinates, null, 2))}
          >
            Copy Coordinates
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
})

// Main component
export function GeometryDetailDialog({ open, onClose, layer }: GeometryDetailDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Reset khi layer thay đổi
  useEffect(() => {
    if (layer) {
      setSearchTerm('')
      setFilterType('all')
      setCurrentPage(1)
      setExpandedPanel(false)
    }
  }, [layer])

  // Process geometries với thông tin đơn giản
  const processedGeometries = useMemo(() => {
    if (!layer?.geometry) return []
    
    setIsProcessing(true)
    
    try {
      const processed = layer.geometry.map((geom, index) => {
        const center = getSimpleCenter(geom)
        const pointCount = getPointCount(geom)

        return {
          ...geom,
          index,
          center,
          pointCount,
          displayName: geom.properties?.name || geom.properties?.Name || `${geom.type} ${index + 1}`
        }
      })
      
      setIsProcessing(false)
      return processed
    } catch (error) {
      console.error('Error processing geometries:', error)
      setIsProcessing(false)
      return []
    }
  }, [layer])

  // Group by geometry type
  const geometryTypes = useMemo(() => {
    const types = [...new Set(processedGeometries.map(g => g.type))]
    return types.map(type => ({
      type,
      count: processedGeometries.filter(g => g.type === type).length
    }))
  }, [processedGeometries])

  // Filtered và paginated geometries
  const { filteredGeometries, totalPages, totalCount } = useMemo(() => {
    let filtered = processedGeometries

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(geom => geom.type === filterType)
    }

    // Filter by search term
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(geom => {
        const searchableText = [
          geom.displayName,
          geom.type,
          ...Object.values(geom.properties || {}).map(v => String(v))
        ].join(' ').toLowerCase()
        
        return searchableText.includes(term)
      })
    }

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedItems = filtered.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

    return {
      filteredGeometries: paginatedItems,
      totalPages,
      totalCount: filtered.length
    }
  }, [processedGeometries, filterType, debouncedSearchTerm, currentPage])

  // Handlers
  const handleAccordionChange = useCallback((panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedPanel(isExpanded ? panel : false)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  const handleFilterType = useCallback((type: string) => {
    setFilterType(type)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    setExpandedPanel(false)
  }, [])

  if (!layer) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              bgcolor: layer.color,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: 2
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Chi tiết Geometries - {layer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {processedGeometries.length} đối tượng trong layer này
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search và Filter */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm đối tượng theo tên hoặc thuộc tính..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Type Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Lọc theo loại:
            </Typography>
            <Chip
              label={`Tất cả (${processedGeometries.length})`}
              size="small"
              color={filterType === 'all' ? 'primary' : 'default'}
              onClick={() => handleFilterType('all')}
              sx={{ cursor: 'pointer' }}
            />
            {geometryTypes.map(({ type, count }) => (
              <Chip
                key={type}
                label={`${type} (${count})`}
                size="small"
                color={filterType === type ? 'primary' : 'default'}
                onClick={() => handleFilterType(type)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ minHeight: 400 }}>
          {isProcessing ? (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Đang xử lý dữ liệu...
              </Typography>
            </Box>
          ) : processedGeometries.length === 0 ? (
            <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>
              Không có đối tượng geometry nào trong layer này.
            </Alert>
          ) : filteredGeometries.length === 0 ? (
            <Alert severity="warning" sx={{ m: 2, borderRadius: 2 }}>
              Không tìm thấy đối tượng nào khớp với bộ lọc hiện tại.
            </Alert>
          ) : (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredGeometries.map((geometry) => (
                  <Accordion
                    key={`geometry-${geometry.index}`}
                    expanded={expandedPanel === `geometry-${geometry.index}`}
                    onChange={handleAccordionChange(`geometry-${geometry.index}`)}
                    sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{ 
                        bgcolor: 'grey.50',
                        borderRadius: '8px 8px 0 0',
                        minHeight: 56,
                        '&.Mui-expanded': {
                          borderRadius: '8px 8px 0 0'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ color: layer.color }}>
                          {getGeometryIcon(geometry.type)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {geometry.displayName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip 
                              label={geometry.type}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            <Chip 
                              label={`Center: ${geometry.center}`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            <Chip 
                              label={geometry.pointCount}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <PropertiesTable properties={geometry.properties} />
                        <GeometryInfo 
                          geometry={geometry} 
                          center={geometry.center} 
                          pointCount={geometry.pointCount}
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    size="small"
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          Trang {currentPage}/{totalPages} - Hiển thị {filteredGeometries.length}/{totalCount} item(s)
        </Typography>
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
        {filteredGeometries.length > 0 && (
          <Button
            variant="contained"
            startIcon={<CopyAll />}
            onClick={() => {
              const exportData = filteredGeometries.map(g => ({
                name: g.displayName,
                type: g.type,
                center: g.center,
                pointCount: g.pointCount,
                properties: g.properties,
                coordinates: g.coordinates
              }))
              copyToClipboard(JSON.stringify(exportData, null, 2))
            }}
          >
            Export ({filteredGeometries.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
} 