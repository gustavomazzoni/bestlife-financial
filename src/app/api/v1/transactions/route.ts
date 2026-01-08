// import { NextRequest, NextResponse } from 'next/server'
// import { requireAuth } from "@/lib/auth/session";
// import { createTransaction, listTransactions } from '@/services/transactions'
// import { CreateTransactionSchema } from '@/lib/validations/transaction'
// import { apiResponse, apiError } from '@/lib/api/response'

// // POST /api/v1/transactions - Create transaction
// export async function POST(request: NextRequest) {
//   try {
//     // 1. Authentication
//     const session = await requireAuth()
//     if (!session?.user?.id) {
//       return apiError('Unauthorized', 401)
//     }

//     // 2. Parse & Validate
//     const body = await request.json()
//     const validated = CreateTransactionSchema.parse(body)

//     // 3. Call Service (Business Logic)
//     const transaction = await createTransaction(session.user.id, validated)

//     // 4. Return Response
//     return apiResponse(transaction, 201)
//   } catch (error) {
//     return apiError(error)
//   }
// }

// // GET /api/v1/transactions - List transactions
// export async function GET(request: NextRequest) {
//   try {
//     // 1. Authentication
//     const session = await getServerSession()
//     if (!session?.user?.id) {
//       return apiError('Unauthorized', 401)
//     }

//     // 2. Parse Query Params
//     const { searchParams } = new URL(request.url)
//     const page = parseInt(searchParams.get('page') || '1')
//     const limit = parseInt(searchParams.get('limit') || '20')
//     const type = searchParams.get('type')
//     const startDate = searchParams.get('startDate')
//     const endDate = searchParams.get('endDate')

//     // 3. Call Service
//     const result = await listTransactions(session.user.id, {
//       page,
//       limit,
//       type,
//       startDate,
//       endDate,
//     })

//     // 4. Return Response with Pagination
//     return apiResponse(result.data, 200, {
//       page,
//       limit,
//       total: result.total,
//       totalPages: Math.ceil(result.total / limit),
//     })
//   } catch (error) {
//     return apiError(error)
//   }
// }
