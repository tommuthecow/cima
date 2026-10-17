import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const bucket = searchParams.get('bucket')

  const where: any = {
    userId: session.user.id
  }

  if (bucket) {
    where.bucket = bucket
  }

  if (type) {
    where.title = {
      type
    }
  }

  const rankings = await prisma.ranking.findMany({
    where,
    include: {
      title: true
    },
    orderBy: [
      { bucket: 'asc' },
      { rank: 'asc' }
    ]
  })

  const grouped = {
    liked: rankings.filter(r => r.bucket === 'liked'),
    fine: rankings.filter(r => r.bucket === 'fine'),
    disliked: rankings.filter(r => r.bucket === 'disliked')
  }

  return NextResponse.json({ rankings: grouped })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rankingId } = await request.json()

  if (!rankingId) {
    return NextResponse.json({ error: 'Missing rankingId' }, { status: 400 })
  }

  const ranking = await prisma.ranking.findUnique({
    where: { id: rankingId }
  })

  if (!ranking || ranking.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.ranking.delete({
      where: { id: rankingId }
    })

    await tx.ranking.updateMany({
      where: {
        userId: session.user.id,
        bucket: ranking.bucket,
        rank: {
          gt: ranking.rank
        }
      },
      data: {
        rank: {
          decrement: 1
        }
      }
    })
  })

  return NextResponse.json({ success: true })
}
