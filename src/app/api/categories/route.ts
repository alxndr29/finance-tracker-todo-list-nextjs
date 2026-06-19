import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const categories = await prisma.category.findMany({
    where: { userId, ...(type ? { type: type as 'INCOME' | 'EXPENSE' } : {}) },
    orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, type, color } = await req.json()

    if (!name || !type) {
      return NextResponse.json({ error: 'Nama dan tipe wajib diisi' }, { status: 400 })
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json({ error: 'Tipe tidak valid' }, { status: 400 })
    }

    // Generate unique slug: try base slug, then append counter if taken
    const baseSlug = slugify(name) || 'kategori'
    let value = baseSlug
    let counter = 1
    while (await prisma.category.findUnique({ where: { userId_value: { userId, value } } })) {
      value = `${baseSlug}_${counter++}`
    }

    const category = await prisma.category.create({
      data: { userId, name, value, type, color: color || '#6B7280', isDefault: false },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
