import { LayerButton, LayerPopper, ProjectError, ProjectLoading } from '@/components/pages/project/project.main-map';
import { MapLayers } from '@/components/pages/project/project.map-layer';
import { PackageDetailPanel } from '@/components/pages/project/project.package-panel';
import { useMockMapData } from '@/hooks';
import { selectedPackageAtom, selectedPackageIdForPanelAtom, selectedZoneAtom, sidePanelOpenAtom } from '@/stores';
import { Box } from '@mui/material';
import { useAtom } from 'jotai';
import { Map as LeafletMapType } from 'leaflet';
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

export function ProjectMainMap({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useMockMapData(projectId)
  const mapRef = useRef<LeafletMapType | null>(null)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [visiblePackages, setVisiblePackages] = useState<Set<string>>(new Set())
  const [visibleZones, setVisibleZones] = useState<Set<string>>(new Set())
  const open = Boolean(anchorEl)

  // Sử dụng atoms cho selected zone/package
  const [selectedZone, setSelectedZone] = useAtom(selectedZoneAtom)
  const [selectedPackage, setSelectedPackage] = useAtom(selectedPackageAtom)
  const [sidePanelOpen, setSidePanelOpen] = useAtom(sidePanelOpenAtom)
  const [selectedPackageId, setSelectedPackageId] = useAtom(selectedPackageIdForPanelAtom)

  const handleViewDetails = (packageId: string) => {
    setSelectedPackageId(packageId)
    setSidePanelOpen(true)
    setSelectedPackage(null)
  }

  const handleClosePanel = () => {
    setSidePanelOpen(false)
    setSelectedPackageId(null)
  }

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

        <MapLayers
          data={data!}
          visibleZones={visibleZones}
          visiblePackages={visiblePackages}
          selectedZone={selectedZone}
          selectedPackage={selectedPackage}
          onZoneClick={setSelectedZone}
          onPackageClick={setSelectedPackage}
          onViewDetails={handleViewDetails}
        />
      </MapContainer>

      {/* Package Detail Side Panel */}
      <PackageDetailPanel
        open={sidePanelOpen}
        onClose={handleClosePanel}
        packageId={selectedPackageId}
      />
    </Box>
  )
}
