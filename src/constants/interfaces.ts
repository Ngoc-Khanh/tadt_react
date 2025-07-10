import { type EStatusType } from '@/constants/enums';

export interface ICredentialResponse {
  Status: number;
  ExtendCode: number;
  Token: string;
  RefreshToken: string;
  ErrorMessage: string | null;
}

export interface IMapResponse {
  project_id: string;
  ten_du_an: string;
  trang_thai: EStatusType;
  ngay_cap_nhat: string;
  tien_do_thuc_te: number;
  anh_tong_quan?: string;
}

export interface IMapDetailResponse {
  project_id: string;
  ten_du_an: string;
  ngay_bd_ke_hoach: string;
  ngay_kt_ke_hoach: string;
  trang_thai: EStatusType;
  tien_do_ke_hoach: number;
  tien_do_thuc_te: number;
  ngay_cap_nhat: string;
}

export interface IZoneResponse {
  zone_id: string;
  ten_phan_khu: string;
  trang_thai: EStatusType;
  tien_do_thuc_te: number;
}

export interface IZoneDetailResponse {
  zone_id: string;
  ten_phan_khu: string;
  project_id: string;
  ngay_bd_ke_hoach: string;
  ngay_kt_ke_hoach: string;
  trang_thai: EStatusType;
  tien_do_thuc_te: number;
  tien_do_ke_hoach: number;
  ngay_cap_nhat: string;
}

export interface IPackageResponse {
  package_id: string;
  ten_goi_thau: string;
  trang_thai: EStatusType;
  tien_do_thuc_te: number;
}

export interface IPackageDetailResponse {
  package_id: string;
  ten_goi_thau: string;
  zone_id: string;
  project_id: string;
  ngay_bd_ke_hoach: string;
  ngay_kt_ke_hoach: string;
  trang_thai: EStatusType;
  tien_do_thuc_te: number;
  tien_do_ke_hoach: number;
  vuong_mac: string;
  ngay_cap_nhat: string;
}