export const EStatus = {
  ACTIVE: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  PAUSED: 'Đã tạm dừng'
} as const;

export type EStatusType = typeof EStatus[keyof typeof EStatus];

export const EMapType = {
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon'
} as const;

export type EMapTypeType = typeof EMapType[keyof typeof EMapType];