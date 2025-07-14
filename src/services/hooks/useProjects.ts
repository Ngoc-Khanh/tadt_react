import type { IProjectResponse } from '@/constants/interfaces'
import { ProjectAPI } from '@/services/project.api'
import { useQuery } from '@tanstack/react-query'

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await ProjectAPI.getProjectsList()
      if (response.IsSuccess && response.Data) return response.Data as IProjectResponse[]
      else throw new Error(response.ErrorMessage || 'Failed to fetch projects')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const useProjectDetail = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await ProjectAPI.getProjectDetail(projectId)
      if (response.IsSuccess && response.Data) return response.Data
      else throw new Error(response.ErrorMessage || 'Failed to fetch project detail')
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
} 