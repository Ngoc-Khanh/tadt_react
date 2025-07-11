import { useQuery } from '@tanstack/react-query'
import { ProjectAPI } from '@/services/project.api'
import type { IMapResponse } from '@/constants/interfaces'

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<IMapResponse[]> => {
      const response = await ProjectAPI.ProjectList()
      return response?.Data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - Dữ liệu được coi là fresh trong 5 phút
    gcTime: 10 * 60 * 1000, // 10 minutes - Cache được giữ trong 10 phút
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

// Hook để refetch projects
export const useProjectsRefetch = () => {
  const { refetch } = useProjects()
  return refetch
} 