import type { IMapMockResponse } from "@/constants/mock";
import { mockMapData } from "@/lib/data-mock-map";
import { useQuery } from "@tanstack/react-query";

const fetchMockMapData = async (projectId: string) => {
  await new Promise(res => setTimeout(res, 500));
  return mockMapData.Data.filter(item => item.project_id === projectId);
}

export function useMockMapData(projectId: string) {
  return useQuery<IMapMockResponse[]>({
    queryKey: ['mockMapData', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Vui lòng chọn dự án trước khi lấy dữ liệu bản đồ");
      const data = await fetchMockMapData(projectId);
      return data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}