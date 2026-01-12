import { describe, it, expect, vi } from 'vitest';
// import { POST } from '@/api/v1/transactions/route'
// import { NextRequest } from 'next/server'

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

// describe('API Authentication', () => {
//   it('returns 401 for unauthenticated requests', async () => {
//     vi.mocked(auth).mockResolvedValue(null)

//     const request = new NextRequest('http://localhost/api/v1/transactions', {
//       method: 'POST',
//       body: JSON.stringify({ amount: 100 }),
//     })

//     const response = await POST(request)
//     expect(response.status).toBe(401)
//   })

//   it('allows authenticated requests', async () => {
//     vi.mocked(auth).mockResolvedValue({
//       user: { id: 'user_123', email: 'test@example.com' }
//     } as any)

//     const request = new NextRequest('http://localhost/api/v1/transactions', {
//       method: 'POST',
//       body: JSON.stringify({
//         date: new Date().toISOString(),
//         amount: 100,
//         description: 'Test',
//         type: 'EXPENSE',
//         category: 'Food',
//       }),
//     })

//     const response = await POST(request)
//     expect(response.status).not.toBe(401)
//   })
// })
