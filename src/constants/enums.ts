export const EStatus = {
  ACTIVE: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  PAUSED: 'Đã tạm dừng'
} as const;

export type EStatusType = typeof EStatus[keyof typeof EStatus];