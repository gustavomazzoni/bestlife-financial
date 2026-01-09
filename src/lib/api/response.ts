import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiResponse(data: any, status = 200, meta?: any) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function apiError(error: unknown, status?: number) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    const statusCode =
      status || (error.message.includes('not found') ? 404 : 400);
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.message.toUpperCase().replace(/\s/g, '_'),
        },
      },
      { status: statusCode }
    );
  }

  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  );
}
