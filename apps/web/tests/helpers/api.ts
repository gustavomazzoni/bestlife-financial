import { NextRequest } from 'next/server';

export function createMockRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/${path}`;

  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function createMockPostRequest(path: string, body: unknown) {
  return createMockRequest(path, { method: 'POST', body });
}

export function createMockPatchRequest(path: string, body: unknown) {
  return createMockRequest(path, { method: 'PATCH', body });
}

export function createMockDeleteRequest(path: string) {
  return createMockRequest(path, { method: 'DELETE' });
}

export async function parseResponse(response: Response) {
  return await response.json();
}
