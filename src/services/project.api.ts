import type { IMapResponse } from "@/constants/interfaces"
import type { SRO } from "@/constants/sro"
import { apiGet } from "./api"

export const ProjectAPI = {
  async ProjectList() {
    const res = await apiGet<SRO<IMapResponse[]>>('/Maps/projects')
    return res.data
  }
}