import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { initializeComparison, Bucket } from '@/lib/ranking'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { titleId, bucket } = await request.json()

  if (!titleId || !bucket) {
    return NextResponse.json({ error: 'Missing titleId or bucket' }, { status: 400 })
  }

  const existingRanking = await prisma.ranking.findUnique({
    where: {
      userId_titleId: {
        userId: session.user.id,
        titleId
      }
    }
  })

  if (existingRanking) {
    return NextResponse.json({ error: 'Title already ranked' }, { status: 400 })
  }

  const existingInBucket = await prisma.ranking.findMany({
    where: {
      userId: session.user.id,
      bucket
    },
    orderBy: {
      rank: 'asc'
    },
    include: {
      title: true
    }
  })

  const items = existingInBucket.map(r => ({ id: r.titleId, rank: r.rank }))
  const comparisonState = initializeComparison(titleId, bucket as Bucket, items)

  if (comparisonState.currentComparisons.length === 0) {
    const score = bucket === 'liked' ? 8.35 : bucket === 'fine' ? 5.0 : 1.65
    await prisma.ranking.create({
      data: {
        userId: session.user.id,
        titleId,
        bucket,
        rank: 0,
        score
      }
    })

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        titleId,
        type: 'ranked',
        bucket,
        score
      }
    })

    return NextResponse.json({
      completed: true,
      finalRank: 0
    })
  }

  const firstComparison = existingInBucket.find(
    r => r.titleId === comparisonState.currentComparisons[0].titleId
  )

  return NextResponse.json({
    completed: false,
    comparisonState,
    compareWith: {
      id: firstComparison!.title.id,
      title: firstComparison!.title.title,
      posterUrl: firstComparison!.title.posterUrl,
      year: firstComparison!.title.year,
      type: firstComparison!.title.type
    }
  })
}
