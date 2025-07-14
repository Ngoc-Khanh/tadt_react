import type { EMapTypeType } from "./enums";
import type { IPackageResponse } from "./interfaces";

export interface IMapMockResponse {
  project_id: string;
  zone_id: string;
  zone_name: string;
  geometry: IMapMockGeometry[];
  packages: IPackageMock[];
}

export interface IPackageMock extends IPackageResponse {
  geometry: IMapMockGeometry[];
}

export interface IMapMockGeometry {
  type: EMapTypeType;
  coordinates: number[][] ;
  properties: {
    name: string;
    description: string;
  }
}