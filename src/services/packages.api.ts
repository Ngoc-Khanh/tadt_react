import type { IPackageDetailResponse, IPackageResponse } from "@/constants/interfaces"
import type { SRO } from "@/constants/sro"
import { apiGet } from "@/services/api"

export const PackageAPI = {
  async getPackagesList() {
    const res = await apiGet<SRO<IPackageResponse[]>>("/Maps/packages")
    return res.data;
  },

  async getPackageDetail(packageId: string) {
    const res = await apiGet<SRO<IPackageDetailResponse>>(`/Maps/packages/${packageId}`)
    return res.data;
  }
}