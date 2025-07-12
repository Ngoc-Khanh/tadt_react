import type { IZoneDetailResponse, IZoneResponse } from "@/constants/interfaces"
import type { SRO } from "@/constants/sro"
import { apiGet } from "@/services/api"

export const ZoneAPI = {
  async getZonesList() {
    const res = await apiGet<SRO<IZoneResponse[]>>("/Maps/zones")
    return res.data;
  },

  async getZoneDetail(zoneId: string) {
    const res = await apiGet<SRO<IZoneDetailResponse>>(`/Maps/zones/${zoneId}`)
    return res.data;
  }
}