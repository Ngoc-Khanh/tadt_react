import { useMockMapData } from '@/hooks';
import { getPackageStatusColor } from '@/lib/package-status-colors';
import { ExpandMore, Layers } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Fade, Popper, Typography } from '@mui/material';
import { Map as LeafletMapType } from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TbEye, TbEyeOff, TbZoomScan } from 'react-icons/tb';
import { MapContainer, Polygon, Polyline, TileLayer } from 'react-leaflet';
import { ProjectError } from './project-error';
import { ProjectLoading } from './project-loading';

// Helper: chuyển đổi geometry thành [lat, lng] coordinates
function getLatLngsFromGeom(geom: { type: string; coordinates: unknown }): [number, number][] {
  if (!geom?.coordinates || !Array.isArray(geom.coordinates)) return [];

  let coords = geom.coordinates;

  // Xử lý Polygon: kiểm tra nested structure
  if (geom.type === 'Polygon' && Array.isArray(coords[0]?.[0])) {
    coords = coords[0]; // GeoJSON chuẩn: lấy ring đầu tiên
  }

  return Array.isArray(coords)
    ? coords
      .filter((c): c is number[] => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number')
      .map(([lng, lat]) => [lat, lng])
    : [];
}

export function ProjectLeafletMap({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useMockMapData(projectId)
  const mapRef = useRef<LeafletMapType | null>(null)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [visiblePackages, setVisiblePackages] = useState<Set<string>>(new Set())
  const [visibleZones, setVisibleZones] = useState<Set<string>>(new Set())
  const open = Boolean(anchorEl)

  // Initialize visibility when data loads
  useEffect(() => {
    if (data) {
      setVisiblePackages(new Set(data.flatMap(zone => zone.packages?.map(pkg => pkg.package_id) || [])))
      setVisibleZones(new Set(data.map(zone => zone.zone_id)))
    }
  }, [data])

  // Toggle visibility functions
  const togglePackageVisibility = useCallback((packageId: string) => {
    setVisiblePackages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(packageId)) {
        newSet.delete(packageId)
      } else {
        newSet.add(packageId)
      }
      return newSet
    })
  }, [])

  const toggleZoneVisibility = useCallback((zoneId: string) => {
    setVisibleZones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId)
      } else {
        newSet.add(zoneId)
      }
      return newSet
    })
  }, [])

  // Navigation function
  const navigateToGeometry = useCallback((geometry: { type: string; coordinates: unknown }[], isPackage = false) => {
    if (!mapRef.current || !geometry?.length) return

    const allCoords = geometry.flatMap(getLatLngsFromGeom)
    if (!allCoords.length) return

    if (allCoords.length === 1) {
      // Zoom to hơn cho package (level 18 thay vì 16)
      const zoomLevel = isPackage ? 18 : 16
      mapRef.current.setView(allCoords[0], zoomLevel, { animate: true })
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
  }, [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isAnimating) return
    setIsAnimating(true)
    setAnchorEl(anchorEl ? null : event.currentTarget)
    setTimeout(() => setIsAnimating(false), 200)
  }, [anchorEl, isAnimating])


  if (isLoading) return <ProjectLoading />;
  if (error) return <ProjectError error={error} />;

  return (
    <Box className="relative h-full w-full overflow-hidden">
      <Box className="absolute top-5 left-5 z-[1000]">
        <Box className="relative">
          <Button
            onClick={handleClick}
            variant="contained"
            disabled={isAnimating}
            sx={{
              minWidth: 48,
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: open ? 'primary.dark' : 'background.paper',
              color: open ? 'white' : 'text.primary',
              border: open ? 'none' : '1px solid',
              borderColor: 'divider',
              boxShadow: open ? 3 : 2,
              '&:hover': {
                bgcolor: open ? 'primary.dark' : 'grey.100',
                transform: 'translateY(-1px)',
                boxShadow: open ? 4 : 3
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Layers fontSize="medium" />
          </Button>

          {data && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: 'error.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                border: '2px solid white',
                boxShadow: 2,
                zIndex: 10,
              }}
            >
              {/* Tổng số geometry của tất cả vùng và package */}
              {data.reduce((sum, zone) => {
                let geomCount = (zone.geometry?.length || 0);
                if (zone.packages) {
                  geomCount += zone.packages.reduce((pkgSum, pkg) => pkgSum + (pkg.geometry?.length || 0), 0);
                }
                return sum + geomCount;
              }, 0)}
            </Box>
          )}
        </Box>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        className='z-[1001]'
        transition
        modifiers={[
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'preventOverflow', options: { boundary: 'viewport', padding: 16 } }
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Box sx={{
              bgcolor: 'background.paper',
              minWidth: 400,
              maxWidth: '90vw',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
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
                maxHeight: '70vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'grey.100', borderRadius: 3 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 3 }
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            sx={{
                              minWidth: 32,
                              height: 32,
                              p: 0.5,
                              borderRadius: '50%',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: 2
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
                          <Button
                            size="small"
                            sx={{
                              minWidth: 32,
                              height: 32,
                              p: 0.5,
                              borderRadius: '50%',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: 2
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToGeometry(zone.geometry || [], false)
                            }}
                          >
                            <TbZoomScan className='w-4 h-4' />
                          </Button>
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
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  sx={{
                                    minWidth: 32,
                                    height: 32,
                                    p: 0.5,
                                    borderRadius: '50%',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      boxShadow: 2
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
                                <Button
                                  size="small"
                                  sx={{
                                    minWidth: 32,
                                    height: 32,
                                    p: 0.5,
                                    borderRadius: '50%',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      boxShadow: 2
                                    }
                                  }}
                                  onClick={() => navigateToGeometry(pkg.geometry || [], true)}
                                >
                                  <TbZoomScan className='w-4 h-4' />
                                </Button>
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

      <MapContainer
        center={[21.0285, 105.8542]} // Hà Nội mặc định
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        preferCanvas={true}
        attributionControl={true}
        worldCopyJump={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Render geometry của vùng */}
        {data?.map((zone) => {
          // Chỉ render nếu zone được hiển thị
          if (!visibleZones.has(zone.zone_id)) return null

          return zone.geometry?.map((geom, idx) => {
            if (geom.type === "LineString") {
              return (
                <Polyline
                  key={`zone-${zone.zone_id}-geom-${idx}`}
                  positions={geom.coordinates.map(([lng, lat]) => [lat, lng])}
                  pathOptions={{ color: "#0EA5E9", weight: 4 }}
                />
              );
            } else if (geom.type === "Polygon") {
              return (
                <Polygon
                  key={`zone-${zone.zone_id}-geom-${idx}`}
                  positions={geom.coordinates.map(([lng, lat]) => [lat, lng])}
                  pathOptions={{ color: "#0EA5E9", weight: 4 }}
                />
              );
            }
            return null;
          })
        })}
        {/* Render geometry của các package */}
        {data?.map((zone) =>
          zone.packages?.flatMap(pkg => {
            // Chỉ render nếu package được hiển thị
            if (!visiblePackages.has(pkg.package_id)) return []

            const statusColor = getPackageStatusColor(pkg.trang_thai, pkg.tien_do_thuc_te);
            return pkg.geometry?.map((geom, idx) => {
              if (geom.type === "LineString") {
                return (
                  <Polyline
                    key={`pkg-${pkg.package_id}-geom-${idx}`}
                    positions={geom.coordinates.map(([lng, lat]) => [lat, lng])}
                    pathOptions={{ color: statusColor.color, weight: 4 }}
                  />
                );
              } else if (geom.type === "Polygon") {
                return (
                  <Polygon
                    key={`pkg-${pkg.package_id}-geom-${idx}`}
                    positions={geom.coordinates.map(([lng, lat]) => [lat, lng])}
                    pathOptions={{ color: statusColor.color, weight: 4 }}
                  />
                );
              }
              return null;
            }) || []
          }) || []
        )}
      </MapContainer>
    </Box>
  )
}
