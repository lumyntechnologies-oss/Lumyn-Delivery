export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

export function errorResponse(error: string, statusCode: number = 400): [ApiResponse, number] {
  return [
    {
      success: false,
      error,
    },
    statusCode,
  ]
}

export function unauthorizedResponse(): [ApiResponse, number] {
  return errorResponse('Unauthorized', 401)
}

export function notFoundResponse(resource: string): [ApiResponse, number] {
  return errorResponse(`${resource} not found`, 404)
}

export function serverErrorResponse(error?: string): [ApiResponse, number] {
  return errorResponse(error || 'Internal server error', 500)
}
