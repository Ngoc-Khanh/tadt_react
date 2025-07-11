import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AssignmentAPI } from '@/services/assignment.api'
import type { 
  SaveAssignmentsRequest, 
  GetImportedDataRequest,
  ImportedLayerData 
} from '@/services/assignment.api'

export const useImportedData = (params?: GetImportedDataRequest) => {
  return useQuery({
    queryKey: ['imported-data', params],
    queryFn: async (): Promise<ImportedLayerData[]> => {
      const response = await AssignmentAPI.getImportedData(params)
      return response?.Data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - Dữ liệu được coi là fresh trong 2 phút
    gcTime: 5 * 60 * 1000, // 5 minutes - Cache được giữ trong 5 phút
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export const useSaveAssignments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SaveAssignmentsRequest) => {
      const response = await AssignmentAPI.saveAssignments(data)
      return response.Data
    },
    onSuccess: () => {
      // Invalidate và refetch imported data queries
      queryClient.invalidateQueries({ queryKey: ['imported-data'] })
    },
    onError: (error) => {
      console.error('[useSaveAssignments] Error saving assignments:', error)
    }
  })
}

export const useDeleteImportedData = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (import_id: string) => {
      const response = await AssignmentAPI.deleteImportedData(import_id)
      return response.Data
    },
    onSuccess: () => {
      // Invalidate và refetch imported data queries
      queryClient.invalidateQueries({ queryKey: ['imported-data'] })
    },
    onError: (error) => {
      console.error('[useDeleteImportedData] Error deleting imported data:', error)
    }
  })
} 