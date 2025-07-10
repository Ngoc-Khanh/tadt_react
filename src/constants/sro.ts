export type SRO<T = unknown> = {
  IsSuccess: boolean;
  StatusCode: string;
  ErrorMessage: string | null;
  Data: T;
}