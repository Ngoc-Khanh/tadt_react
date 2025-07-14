import type { EStatusType } from '@/constants/enums'

// Định nghĩa các màu sắc cho từng trạng thái tiến độ
export const PACKAGE_STATUS_COLORS = {
  NOT_STARTED: {
    color: '#9CA3AF', // Xám
    label: 'Chưa triển khai',
    chipColor: 'default' as const
  },
  IN_PROGRESS_ON_TIME: {
    color: '#0EA5E9', // Xanh nước biển
    label: 'Đang triển khai đúng tiến độ',
    chipColor: 'info' as const
  },
  IN_PROGRESS_DELAYED: {
    color: '#FACC15', // Vàng
    label: 'Đang triển khai chậm tiến độ',
    chipColor: 'warning' as const
  },
  DONE_ON_TIME: {
    color: '#22C55E', // Xanh lá cây
    label: 'Hoàn thành đúng tiến độ',
    chipColor: 'success' as const
  },
  DONE_DELAYED: {
    color: '#EF4444', // Đỏ
    label: 'Hoàn thành chậm tiến độ',
    chipColor: 'error' as const
  }
} as const

export type PackageStatusType = keyof typeof PACKAGE_STATUS_COLORS

/**
 * Xác định trạng thái tiến độ của gói thầu dựa vào trang_thai và tien_do_thuc_te
 * @param trang_thai - Trạng thái hiện tại của gói thầu
 * @param tien_do_thuc_te - Tiến độ thực tế (0-100)
 * @param tien_do_ke_hoach - Tiến độ kế hoạch (0-100), mặc định là 100
 * @returns PackageStatusType
 */
export function getPackageStatus(
  trang_thai: EStatusType,
  tien_do_thuc_te: number,
  tien_do_ke_hoach: number = 100
): PackageStatusType {
  // Chưa triển khai
  if (trang_thai === 'Chờ xử lý' || tien_do_thuc_te === 0) {
    return 'NOT_STARTED'
  }
  
  // Hoàn thành
  if (trang_thai === 'Hoàn thành' || tien_do_thuc_te >= 100) {
    // Kiểm tra xem có chậm tiến độ không (so với kế hoạch)
    if (tien_do_thuc_te >= tien_do_ke_hoach) {
      return 'DONE_ON_TIME'
    } else {
      return 'DONE_DELAYED'
    }
  }
  
  // Đang thực hiện
  if (trang_thai === 'Đang thực hiện' || trang_thai === 'Đang xử lý') {
    // So sánh với tiến độ kế hoạch để xác định có chậm không
    if (tien_do_thuc_te >= tien_do_ke_hoach * 0.9) { // Tolerance 10%
      return 'IN_PROGRESS_ON_TIME'
    } else {
      return 'IN_PROGRESS_DELAYED'
    }
  }
  
  // Đã hủy hoặc tạm dừng
  if (trang_thai === 'Đã hủy' || trang_thai === 'Đã tạm dừng') {
    return 'NOT_STARTED'
  }
  
  // Mặc định
  return 'NOT_STARTED'
}

/**
 * Lấy thông tin màu sắc của gói thầu
 * @param trang_thai - Trạng thái hiện tại
 * @param tien_do_thuc_te - Tiến độ thực tế
 * @param tien_do_ke_hoach - Tiến độ kế hoạch
 * @returns Object chứa color, label, chipColor
 */
export function getPackageStatusColor(
  trang_thai: EStatusType,
  tien_do_thuc_te: number,
  tien_do_ke_hoach?: number
) {
  const status = getPackageStatus(trang_thai, tien_do_thuc_te, tien_do_ke_hoach)
  return PACKAGE_STATUS_COLORS[status]
} 