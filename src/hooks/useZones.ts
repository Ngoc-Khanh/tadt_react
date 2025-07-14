import { useQuery } from '@tanstack/react-query'
import { ZoneAPI } from '@/services/zone.api'
import type { IZoneResponse } from '@/constants/interfaces'

export const useZones = () => {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const response = await ZoneAPI.getZonesList()
      if (response.IsSuccess && response.Data) return response.Data as IZoneResponse[]
      else throw new Error(response.ErrorMessage || 'Failed to fetch zones')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const useZoneDetail = (zoneId: string) => {
  return useQuery({
    queryKey: ['zone', zoneId],
    queryFn: async () => {
      const response = await ZoneAPI.getZoneDetail(zoneId)
      if (response.IsSuccess && response.Data) return response.Data
      else throw new Error(response.ErrorMessage || 'Failed to fetch zone detail')
    },
    enabled: !!zoneId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
} 