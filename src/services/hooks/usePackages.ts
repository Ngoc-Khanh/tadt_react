import type { IPackageResponse } from '@/constants/interfaces'
import { PackageAPI } from '@/services/packages.api'
import { useQuery } from '@tanstack/react-query'

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await PackageAPI.getPackagesList()
      if (response.IsSuccess && response.Data) return response.Data as IPackageResponse[]
      else throw new Error(response.ErrorMessage || 'Failed to fetch packages')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const usePackageDetail = (packageId: string) => {
  return useQuery({
    queryKey: ['package', packageId],
    queryFn: async () => {
      const response = await PackageAPI.getPackageDetail(packageId)
      if (response.IsSuccess && response.Data) return response.Data
      else throw new Error(response.ErrorMessage || 'Failed to fetch package detail')
    },
    enabled: !!packageId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
} 