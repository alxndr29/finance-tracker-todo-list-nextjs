import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const transaction = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ transaction })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { type, amount, category, description, date, imageUrl, imageName, notes } =
      await req.json()

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
        imageUrl,
        imageName,
        notes,
      },
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing.imageUrl) {
    const filePath = path.join(process.cwd(), 'public', existing.imageUrl)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  await prisma.transaction.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
