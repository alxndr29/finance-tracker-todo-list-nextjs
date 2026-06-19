import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    orderBy: { category: 'asc' },
  })

  // Get actual spending for each budget category
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const spending = await prisma.transaction.groupBy({
    by: ['category'],
    where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
    _sum: { amount: true },
  })

  const spendingMap = Object.fromEntries(
    spending.map((s) => [s.category, Number(s._sum.amount || 0)])
  )

  const budgetsWithSpending = budgets.map((b) => ({
    ...b,
    amount: Number(b.amount),
    spent: spendingMap[b.category] || 0,
    remaining: Number(b.amount) - (spendingMap[b.category] || 0),
    percentage: Math.min(((spendingMap[b.category] || 0) / Number(b.amount)) * 100, 100),
  }))

  return NextResponse.json({ budgets: budgetsWithSpending, month, year })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { category, amount, month, year } = await req.json()

    if (!category || !amount || !month || !year) {
      return NextResponse.json({ error: 'Field wajib tidak lengkap' }, { status: 400 })
    }

    const budget = await prisma.budget.upsert({
      where: { userId_category_month_year: { userId, category, month, year } },
      update: { amount: parseFloat(amount) },
      create: { userId, category, amount: parseFloat(amount), month, year },
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
