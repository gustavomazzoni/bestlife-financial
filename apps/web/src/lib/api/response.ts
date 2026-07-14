import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

function parseErrorMessageToObject(errorMessage: string) {
  return {
    error: {
      message: errorMessage,
      code: errorMessage.toUpperCase().replace(/\s/g, '_'),
    },
  };
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
    timestamp?: string;
  };
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export function apiResponse<T>(
  data: T,
  status = 200,
  meta?: ApiSuccessResponse['meta']
): NextResponse<ApiSuccessResponse<T> | null> {
  if (status === 204) return new NextResponse(null, { status: 204 });

  const response: ApiSuccessResponse<T> = { data };
  if (meta) response.meta = meta;

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function apiError(error: unknown, status?: number) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json(parseErrorMessageToObject(error.message), {
      status: 401,
    });
  }

  if (error instanceof Error) {
    const errorCode = error.message.toUpperCase().replace(/\s+/g, '_');
    const statusCode = status || getStatusFromError(error.message);

    if (statusCode === 400) console.log('400 error', error);

    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: errorCode,
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    );
  }

  // Unknown errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

function getStatusFromError(message: string): number {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('not found')) return 404;
  if (lowerMessage.includes('unauthorized')) return 401;
  if (lowerMessage.includes('forbidden')) return 403;
  if (lowerMessage.includes('conflict')) return 409;
  if (lowerMessage.includes('invalid') || lowerMessage.includes('must'))
    return 400;

  return 400;
}

// HTTP status code helpers
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;
