import { NextResponse } from "next/server";

/**
 * Standardized error response format for API routes.
 * 
 * All API routes should use these utilities to ensure consistent error responses.
 */

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Creates a standardized error response.
 * 
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 500)
 * @param code - Optional error code for client-side handling
 * @param details - Optional additional error details (sanitized, no sensitive data)
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response: ApiError = {
    error: errorMessage,
  };
  
  if (code) {
    response.code = code;
  }
  
  if (details !== undefined) {
    response.details = details;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Common error responses for frequent scenarios.
 */
export const ApiErrors = {
  unauthorized: () =>
    createErrorResponse("Unauthorized", 401, "UNAUTHORIZED"),
  
  forbidden: () =>
    createErrorResponse("Forbidden", 403, "FORBIDDEN"),
  
  notFound: (resource: string = "Resource") =>
    createErrorResponse(`${resource} not found`, 404, "NOT_FOUND"),
  
  badRequest: (message: string, details?: unknown) =>
    createErrorResponse(message, 400, "BAD_REQUEST", details),
  
  validationError: (details: unknown) =>
    createErrorResponse("Validation failed", 400, "VALIDATION_ERROR", details),
  
  internalServerError: (message: string = "Internal Server Error") =>
    createErrorResponse(message, 500, "INTERNAL_ERROR"),
  
  serviceUnavailable: (message: string = "Service temporarily unavailable") =>
    createErrorResponse(message, 503, "SERVICE_UNAVAILABLE"),
} as const;

