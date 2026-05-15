export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";