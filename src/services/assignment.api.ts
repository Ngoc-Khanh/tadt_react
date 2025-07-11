import type { SRO } from "@/constants/sro"
import { apiGet, apiPost } from "./api"
import type { PackageAssignment } from "@/stores/importKMLAtoms"
import type { LayerGroup } from "@/stores/importKMLAtoms"

export interface SaveAssignmentsRequest {
  project_id: string
  assignments: PackageAssignment[]
  layer_groups: LayerGroup[]
}

export interface SaveAssignmentsResponse {
  success: boolean
  message: string
  import_id: string
}

export interface GetImportedDataRequest {
  project_id?: string
  import_id?: string
}

export interface ImportedLayerData {
  import_id: string
  project_id: string
  project_name: string
  layer_groups: LayerGroup[]
  assignments: PackageAssignment[]
  created_at: string
  updated_at: string
}

export const AssignmentAPI = {
  async saveAssignments(data: SaveAssignmentsRequest) {
    const res = await apiPost<SaveAssignmentsRequest, SRO<SaveAssignmentsResponse>>(
      '/api/Maps/assignments', 
      data
    )
    return res.data
  },

  async getImportedData(params?: GetImportedDataRequest) {
    const queryParams = new URLSearchParams()
    if (params?.project_id) queryParams.append('project_id', params.project_id)
    if (params?.import_id) queryParams.append('import_id', params.import_id)
    
    const endpoint = `/api/Maps/imported-data${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const res = await apiGet<SRO<ImportedLayerData[]>>(endpoint)
    return res.data
  },

  async deleteImportedData(import_id: string) {
    const res = await apiPost<{ import_id: string }, SRO<{ success: boolean }>>(
      '/api/Maps/delete-imported-data',
      { import_id }
    )
    return res.data
  }
} 