export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(error: string): ApiResponse {
  return { success: false, error };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<{ items: T[]; total: number; page: number; totalPages: number; hasNext: boolean }> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data: {
      items: data,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
    },
  };
}
