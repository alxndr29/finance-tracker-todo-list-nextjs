import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [incomeAgg, expenseAgg, expenseByCategory, incomeByCategory, dailyBreakdown] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { userId, type: 'INCOME', date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.$queryRaw<{ day: number; income: number; expense: number }[]>`
        SELECT
          EXTRACT(DAY FROM date)::int as day,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)::float as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::float as expense
        FROM "Transaction"
        WHERE "userId" = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        GROUP BY EXTRACT(DAY FROM date)
        ORDER BY day
      `,
    ])

  const totalIncome = Number(incomeAgg._sum.amount || 0)
  const totalExpense = Number(expenseAgg._sum.amount || 0)

  return NextResponse.json({
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount: incomeAgg._count,
      expenseCount: expenseAgg._count,
    },
    expenseByCategory: expenseByCategory.map((c) => ({
      category: c.category,
      amount: Number(c._sum.amount || 0),
    })),
    incomeByCategory: incomeByCategory.map((c) => ({
      category: c.category,
      amount: Number(c._sum.amount || 0),
    })),
    dailyBreakdown,
    month,
    year,
  })
}
