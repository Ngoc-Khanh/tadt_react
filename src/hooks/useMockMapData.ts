import type { IMapMockResponse, IPackageMockDetailResponse } from "@/constants/mock";
import { dataMockPackageDetail, mockMapData } from "@/lib/data-mock-map";
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

const fetchMockPackageDetail = async (packageId: string) => {
  await new Promise(res => setTimeout(res, 500));
  const packageData = dataMockPackageDetail.Data
    .find(pkg => pkg.package_id === packageId);
  if (!packageData) throw new Error("Không tìm thấy gói thầu với ID: " + packageId);
  return packageData;
}

export function useMockDetailPackage(packageId: string) {
  return useQuery<IPackageMockDetailResponse>({
    queryKey: ['mockPackageDetail', packageId],
    queryFn: async () => {
      if (!packageId) throw new Error("Vui lòng chọn gói thầu trước khi lấy dữ liệu chi tiết");
      const data = await fetchMockPackageDetail(packageId);
      return data;
    },
    enabled: !!packageId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}