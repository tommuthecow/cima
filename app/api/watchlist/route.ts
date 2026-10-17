import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const watchlist = await prisma.watchlist.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      title: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({ watchlist })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, tmdbId, posterUrl, year, type, genres } = body

  if (!title || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let titleRecord = await prisma.title.findFirst({
    where: tmdbId ? { tmdbId } : { title, type }
  })

  if (!titleRecord) {
    titleRecord = await prisma.title.create({
      data: {
        tmdbId,
        title,
        posterUrl,
        year,
        type,
        genres: genres ? JSON.stringify(genres) : null
      }
    })
  }

  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_titleId: {
        userId: session.user.id,
        titleId: titleRecord.id
      }
    }
  })

  if (existing) {
    return NextResponse.json({ message: 'Already in watchlist' })
  }

  await prisma.watchlist.create({
    data: {
      userId: session.user.id,
      titleId: titleRecord.id
    }
  })

  return NextResponse.json({ success: true, titleId: titleRecord.id })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { titleId } = await request.json()

  if (!titleId) {
    return NextResponse.json({ error: 'Missing titleId' }, { status: 400 })
  }

  await prisma.watchlist.delete({
    where: {
      userId_titleId: {
        userId: session.user.id,
        titleId
      }
    }
  })

  return NextResponse.json({ success: true })
}
