import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ todos })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, dueDate } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })

  const todo = await prisma.todo.create({
    data: {
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })

  return NextResponse.json({ todo }, { status: 201 })
}
