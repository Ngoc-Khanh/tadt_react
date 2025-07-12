import type { IProjectDetailResponse, IProjectResponse } from "@/constants/interfaces"
import type { SRO } from "@/constants/sro"
import { apiGet } from "@/services/api"

export const ProjectAPI = {
  async getProjectsList() {
    const res = await apiGet<SRO<IProjectResponse[]>>("/Maps/projects")
    return res.data;
  },

  async getProjectDetail(projectId: string) {
    const res = await apiGet<SRO<IProjectDetailResponse>>(`/Maps/projects/${projectId}`)
    return res.data;
  }
}