import { NextResponse } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Standardized API error response.
 * In production, hides internal error details and logs them server-side.
 */
export function apiError(
  status: number,
  message: string,
  internalError?: unknown
): NextResponse {
  if (internalError) {
    console.error(`[API Error ${status}]`, internalError)
  }

  // In production, hide internal details for 500 errors
  const safeMessage =
    isProduction && status >= 500
      ? 'Erro interno do servidor'
      : message

  return NextResponse.json({ error: safeMessage }, { status })
}

/**
 * Standardized API success response.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}
