import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.category.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { name, color } = await req.json()

    if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })

    // If name changed, regenerate slug (only for non-default categories)
    let value = existing.value
    if (!existing.isDefault && name !== existing.name) {
      const baseSlug = slugify(name) || 'kategori'
      value = baseSlug
      let counter = 1
      while (
        await prisma.category.findFirst({
          where: { userId, value, NOT: { id } },
        })
      ) {
        value = `${baseSlug}_${counter++}`
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, color: color || existing.color, value },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.category.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if category is used in transactions
  const usageCount = await prisma.transaction.count({
    where: { userId, category: existing.value },
  })

  if (usageCount > 0) {
    return NextResponse.json(
      { error: `Kategori digunakan oleh ${usageCount} transaksi. Pindahkan transaksi terlebih dahulu.` },
      { status: 409 }
    )
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
