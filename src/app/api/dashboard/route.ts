import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [incomeAgg, expenseAgg, recentTransactions, categoryBreakdown, monthlyTrend] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.transaction.groupBy({
        by: ['category', 'type'],
        where: { userId, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      // Last 6 months trend
      prisma.$queryRaw<{ month: number; year: number; income: number; expense: number }[]>`
        SELECT
          EXTRACT(MONTH FROM date)::int as month,
          EXTRACT(YEAR FROM date)::int as year,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)::float as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::float as expense
        FROM "Transaction"
        WHERE "userId" = ${userId}
          AND date >= ${new Date(year, month - 7, 1)}
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
        ORDER BY year, month
      `,
    ])

  const totalIncome = Number(incomeAgg._sum.amount || 0)
  const totalExpense = Number(expenseAgg._sum.amount || 0)

  return NextResponse.json({
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      month,
      year,
    },
    recentTransactions,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      type: c.type,
      amount: Number(c._sum.amount || 0),
    })),
    monthlyTrend,
  })
}
