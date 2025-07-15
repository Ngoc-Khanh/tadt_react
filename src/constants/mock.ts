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

export interface IPackageMockDetailResponse {
  package_id: string;
  ten_goi_thau: string;
  ngay_bd_ke_hoach: string;
  ngay_kt_ke_hoach: string;
  tien_do_thuc_te: number;
  tien_do_ke_hoach: number;
  danh_sach_goi_thau: string[];
}