import { useQuery } from '@tanstack/react-query'
import { PackageAPI } from '@/services/package.api'
import type { IPackageResponse } from '@/constants/interfaces'

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async (): Promise<IPackageResponse[]> => {
      const response = await PackageAPI.PackageList()
      return response?.Data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - Dữ liệu được coi là fresh trong 5 phút
    gcTime: 10 * 60 * 1000, // 10 minutes - Cache được giữ trong 10 phút
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
} 