import type { IMapMockResponse } from '@/constants/mock';
import { getPackageStatusColor } from '@/lib/package-status-colors';
import React from 'react';
import { PackageGeometry } from './package-geometry';
import { ZoneGeometry } from './zone-geometry';

interface MapLayersProps {
  data: IMapMockResponse[];
  visibleZones: Set<string>;
  visiblePackages: Set<string>;
  selectedZone: string | null;
  selectedPackage: string | null;
  onZoneClick: (zoneId: string) => void;
  onPackageClick: (packageId: string) => void;
  onViewDetails: (packageId: string) => void;
}

export const MapLayers: React.FC<MapLayersProps> = React.memo(({ data, visibleZones, visiblePackages, selectedZone, selectedPackage, onZoneClick, onPackageClick, onViewDetails }) => {
  return (
    <>
      {/* Render geometry của vùng */}
      {data?.map((zone) => {
        if (!visibleZones.has(zone.zone_id)) return null;

        return (
          <ZoneGeometry
            key={zone.zone_id}
            zoneId={zone.zone_id}
            zoneName={zone.zone_name}
            packageCount={zone.packages?.length || 0}
            geometry={zone.geometry}
            selectedZone={selectedZone}
            onZoneClick={onZoneClick}
          />
        );
      })}

      {/* Render geometry của các package */}
      {data?.flatMap((zone) => zone.packages?.flatMap(pkg => {
        if (!visiblePackages.has(pkg.package_id)) return [];

        const statusColor = getPackageStatusColor(pkg.trang_thai, pkg.tien_do_thuc_te);

        return (
          <PackageGeometry
            key={pkg.package_id}
            packageId={pkg.package_id}
            packageName={pkg.ten_goi_thau}
            status={pkg.trang_thai}
            statusColor={statusColor}
            progress={pkg.tien_do_thuc_te}
            geometry={pkg.geometry}
            selectedPackage={selectedPackage}
            onPackageClick={onPackageClick}
            onViewDetails={onViewDetails}
          />
        );
      }) || []
      )}
    </>
  );
}); 