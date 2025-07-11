import type { SRO } from "@/constants/sro"
import { apiGet } from "./api"
import type { IPackageResponse } from "@/constants/interfaces"

export const PackageAPI = {
  async PackageList() {
    const res = await apiGet<SRO<IPackageResponse[]>>('/api/Maps/packages')
    return res.data
  }
}