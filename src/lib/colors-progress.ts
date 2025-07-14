// Màu sắc cho tiến độ thực tế
export const PROGRESS_COLORS = {
  COMPLETED: '#4caf50',    // Xanh lá - hoàn thành 100%
  IN_PROGRESS: '#ff9800',  // Cam - đang thực hiện 50-99%
  NOT_STARTED: '#f44336',  // Đỏ - chưa bắt đầu 0-49%
  DEFAULT: '#2196f3'       // Xanh dương - mặc định
} as const

// Màu sắc cho UI
export const UI_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#666',
  BACKGROUND: '#e0e0e0',
  BORDER: '#e0e0e0'
} as const

// Hàm helper để lấy màu dựa trên tiến độ
export const getProgressColor = (progress: number): string => {
  if (progress >= 100) return PROGRESS_COLORS.COMPLETED
  if (progress >= 50) return PROGRESS_COLORS.IN_PROGRESS
  return PROGRESS_COLORS.NOT_STARTED
}

// Cấu hình màu sắc cho polygon
export const POLYGON_STYLES = {
  weight: 2,
  opacity: 0.8,
  fillOpacity: 0.3
} as const 