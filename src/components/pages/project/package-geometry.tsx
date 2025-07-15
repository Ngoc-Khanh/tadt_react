import type { IMapMockGeometry } from '@/constants/mock';
import React from 'react';
import { Polygon, Polyline, Popup } from 'react-leaflet';
import { PackagePopup } from './package-popup';

interface PackageGeometryProps {
  packageId: string;
  packageName: string;
  status: string;
  statusColor: { color: string; label: string };
  progress: number;
  geometry: IMapMockGeometry[];
  selectedPackage: string | null;
  onPackageClick: (packageId: string) => void;
  onViewDetails: (packageId: string) => void;
}

export const PackageGeometry: React.FC<PackageGeometryProps> = React.memo(({
  packageId,
  packageName,
  status,
  statusColor,
  progress,
  geometry,
  selectedPackage,
  onPackageClick,
  onViewDetails
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderGeometry = (geom: any, idx: number) => {
    const commonProps = {
      key: `pkg-${packageId}-geom-${idx}`,
      positions: geom.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      pathOptions: { color: statusColor.color, weight: 4 },
      eventHandlers: { click: () => onPackageClick(packageId) }
    };

    const popupContent = selectedPackage === packageId ? (
      <Popup>
        <PackagePopup
          packageName={packageName}
          status={status}
          statusColor={statusColor}
          progress={progress}
          onViewDetails={() => onViewDetails(packageId)}
        />
      </Popup>
    ) : null;

    if (geom.type === "LineString") {
      return (
        <Polyline {...commonProps}>
          {popupContent}
        </Polyline>
      );
    }
    if (geom.type === "Polygon") {
      return (
        <Polygon {...commonProps}>
          {popupContent}
        </Polygon>
      );
    }
    return null;
  };

  return <>{geometry?.map(renderGeometry)}</>;
}); 