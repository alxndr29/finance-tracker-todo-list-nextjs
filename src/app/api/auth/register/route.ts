import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, name } = await req.json()

    if (!username || !email || !password || !name) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })

    if (existing) {
      return NextResponse.json({ error: 'Username atau email sudah terdaftar' }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { username, email, password: hashed, name },
    })

    // Seed default categories for new user
    const defaultCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: 'EXPENSE' as const, isDefault: true })),
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: 'INCOME' as const, isDefault: true })),
    ]

    await prisma.category.createMany({
      data: defaultCategories.map((c) => ({
        userId: user.id,
        name: c.name,
        value: c.value,
        type: c.type,
        color: c.color,
        isDefault: c.isDefault,
      })),
    })

    const token = signToken({ userId: user.id, username: user.username, email: user.email })

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, name: user.name },
      token,
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
