import type { IMapMockResponse } from '@/constants/mock';
import { getLatLngsFromGeom } from '@/lib/get-lat-lags-from-geom';
import { getPackageStatusColor } from '@/lib/package-status-colors';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Fade, Popper, Typography, Tooltip } from '@mui/material';
import { Map as LeafletMapType } from 'leaflet';
import { useCallback } from 'react';
import { TbEye, TbEyeOff, TbZoomScan } from 'react-icons/tb';

interface LayerPopperProps {
  open: boolean
  anchorEl: HTMLElement | null
  data: IMapMockResponse[]
  visibleZones: Set<string>
  visiblePackages: Set<string>
  mapRef: React.RefObject<LeafletMapType> | null
  setVisiblePackages: React.Dispatch<React.SetStateAction<Set<string>>>
  setVisibleZones: React.Dispatch<React.SetStateAction<Set<string>>>
}

export function LayerPopper({ open, anchorEl, data, visibleZones, visiblePackages, mapRef, setVisiblePackages, setVisibleZones }: LayerPopperProps) {
  // Toggle visibility functions
  const togglePackageVisibility = useCallback((packageId: string) => {
    setVisiblePackages((prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(packageId)) {
        newSet.delete(packageId)
      } else {
        newSet.add(packageId)
      }
      return newSet
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleZoneVisibility = useCallback((zoneId: string) => {
    setVisibleZones((prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId)
      } else {
        newSet.add(zoneId)
      }
      return newSet
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Navigation function
  const navigateToGeometry = useCallback((geometry: { type: string; coordinates: unknown }[], isPackage = false) => {
    if (!mapRef?.current || !geometry?.length) return

    const allCoords = geometry.flatMap(getLatLngsFromGeom)
    if (!allCoords.length) return

    if (allCoords.length === 1) {
      // Zoom to hơn cho package (level 18 thay vì 16)
      const zoomLevel = isPackage ? 18 : 16
      mapRef?.current.setView(allCoords[0], zoomLevel, { animate: true })
    } else {
      const lats = allCoords.map(([lat]) => lat)
      const lngs = allCoords.map(([, lng]) => lng)
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ]
      // Zoom to hơn cho package và padding nhỏ hơn để zoom sát hơn
      const maxZoom = isPackage ? 18 : 15
      const padding: [number, number] = isPackage ? [20, 20] : [40, 40]
      mapRef.current.fitBounds(bounds, { animate: true, padding, maxZoom })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      className='z-[1001]'
      transition
      modifiers={[
        { name: 'offset', options: { offset: [0, 8] } },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 16,
            altAxis: true,
            altBoundary: true
          }
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top-start', 'bottom-end', 'top-end']
          }
        }
      ]}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Box sx={{
            bgcolor: 'background.paper',
            minWidth: 400,
            maxWidth: 'min(90vw, 500px)',
            maxHeight: 'min(80vh, 600px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box className='flex justify-between items-start'>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    Lớp bản đồ
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Quản lý các lớp bản đồ trên bản đồ
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{
              p: 2,
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-track': { bgcolor: 'grey.100', borderRadius: 3 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'grey.400',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'grey.600'
                }
              }
            }}>
              {data?.map((zone) => (
                <Accordion key={zone.zone_id}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{zone.zone_name}</Typography>
                        {/* Hiển thị loại geometry của vùng */}
                        {zone.geometry?.map((geom, idx) => (
                          <Chip
                            key={`zone-${zone.zone_id}-geomtype-${idx}`}
                            label={geom.type}
                            size="small"
                            color={geom.type === 'LineString' ? 'info' : 'success'}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, paddingRight: 1 }}>
                        <Tooltip title="Hiển thị/Ẩn vùng">
                          <Button
                            size="small"
                            sx={{
                              minWidth: 32,
                              height: 32,
                              p: 0.5,
                              borderRadius: '50%',
                              color: visibleZones.has(zone.zone_id) ? 'success.main' : 'grey.600',
                              background: 'transparent',
                              boxShadow: 'none',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: 2,
                                borderColor: visibleZones.has(zone.zone_id) ? 'success.dark' : 'grey.500',
                                background: 'transparent'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleZoneVisibility(zone.zone_id)
                            }}
                          >
                            {visibleZones.has(zone.zone_id) ? (
                              <TbEye className='w-4 h-4' />
                            ) : (
                              <TbEyeOff className='w-4 h-4' />
                            )}
                          </Button>
                        </Tooltip>
                        <Tooltip title="Zoom đến vùng">
                          <Button
                            size="small"
                            sx={{
                              minWidth: 32,
                              height: 32,
                              p: 0.5,
                              borderRadius: '50%',
                              background: 'transparent',
                              boxShadow: 'none',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: 2,
                                borderColor: 'primary.dark',
                                background: 'transparent'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToGeometry(zone.geometry || [], false)
                            }}
                          >
                            <TbZoomScan className='w-4 h-4' />
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {zone.packages?.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                          Danh sách gói thầu
                        </Typography>
                        {zone.packages.map(pkg => (
                          <Box
                            key={pkg.package_id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              mb: 1,
                              bgcolor: 'grey.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'grey.200'
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                                {pkg.ten_goi_thau}
                              </Typography>
                              {pkg.trang_thai && (() => {
                                const statusColor = getPackageStatusColor(pkg.trang_thai, pkg.tien_do_thuc_te);
                                return (
                                  <Chip
                                    label={statusColor.label}
                                    size="small"
                                    color={statusColor.chipColor}
                                    variant="outlined"
                                    sx={{
                                      borderColor: statusColor.color,
                                      color: statusColor.color,
                                      '& .MuiChip-label': { fontSize: '0.75rem' }
                                    }}
                                  />
                                );
                              })()}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Hiển thị/Ẩn gói thầu">
                                <Button
                                  size="small"
                                  sx={{
                                    minWidth: 28,
                                    height: 28,
                                    p: 0.5,
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      boxShadow: 2,
                                      borderColor: visiblePackages.has(pkg.package_id) ? 'success.dark' : 'grey.500',
                                      background: 'transparent'
                                    }
                                  }}
                                  onClick={() => togglePackageVisibility(pkg.package_id)}
                                >
                                  {visiblePackages.has(pkg.package_id) ? (
                                    <TbEye className='w-4 h-4' />
                                  ) : (
                                    <TbEyeOff className='w-4 h-4' />
                                  )}
                                </Button>
                              </Tooltip>
                              <Tooltip title="Zoom đến gói thầu">
                                <Button
                                  size="small"
                                  sx={{
                                    minWidth: 28,
                                    height: 28,
                                    p: 0.5,
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      boxShadow: 2,
                                      borderColor: 'primary.dark',
                                      background: 'transparent'
                                    }
                                  }}
                                  onClick={() => navigateToGeometry(pkg.geometry || [], true)}
                                >
                                  <TbZoomScan className='w-4 h-4' />
                                </Button>
                              </Tooltip>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Không có gói thầu</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Fade>
      )}
    </Popper>
  )
}