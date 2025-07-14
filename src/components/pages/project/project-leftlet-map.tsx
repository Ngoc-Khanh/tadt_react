import { useMockMapData } from '@/hooks';
import { getPackageStatusColor } from '@/lib/package-status-colors';
import { Box } from '@mui/material';
import { Map as LeafletMapType } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Polygon, Polyline, TileLayer } from 'react-leaflet';
import { LayerButton } from './layer-button';
import { LayerPopper } from './layer-popper';
import { ProjectError } from './project-error';
import { ProjectLoading } from './project-loading';

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

  if (isLoading) return <ProjectLoading />;
  if (error) return <ProjectError error={error} />;

  return (
    <Box className="relative h-full w-full overflow-hidden">
      <LayerButton
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        isAnimating={isAnimating}
        setIsAnimating={setIsAnimating}
        open={open}
        data={data!}
      />

      <LayerPopper
        open={open}
        anchorEl={anchorEl}
        data={data!}
        visibleZones={visibleZones}
        visiblePackages={visiblePackages}
        mapRef={mapRef as React.RefObject<LeafletMapType>}
        setVisiblePackages={setVisiblePackages}
        setVisibleZones={setVisibleZones}
      />

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
