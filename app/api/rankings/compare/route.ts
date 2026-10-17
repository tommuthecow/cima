import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNextComparison, getFinalInsertPosition, deriveScore, Bucket, ComparisonState } from '@/lib/ranking'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { comparisonState, userPreferredNew } = await request.json()

  if (!comparisonState || typeof userPreferredNew !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const state: ComparisonState = comparisonState
  const bucket = state.bucket
  
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
  
  const nextState = getNextComparison(state, userPreferredNew, items)

  if (!nextState) {
    const finalRank = getFinalInsertPosition(state, userPreferredNew, items)
    
    await prisma.$transaction(async (tx) => {
      await tx.ranking.updateMany({
        where: {
          userId: session.user.id,
          bucket,
          rank: {
            gte: finalRank
          }
        },
        data: {
          rank: {
            increment: 1
          }
        }
      })

      const totalInBucket = existingInBucket.length + 1
      const score = deriveScore(bucket as Bucket, finalRank, totalInBucket)

      await tx.ranking.create({
        data: {
          userId: session.user.id,
          titleId: state.newTitleId,
          bucket,
          rank: finalRank,
          score
        }
      })

      await tx.activity.create({
        data: {
          userId: session.user.id,
          titleId: state.newTitleId,
          type: 'ranked',
          bucket,
          score
        }
      })

      for (let i = 0; i < existingInBucket.length; i++) {
        const item = existingInBucket[i]
        const newRank = item.rank >= finalRank ? item.rank + 1 : item.rank
        const newScore = deriveScore(bucket as Bucket, newRank, totalInBucket)
        
        await tx.ranking.update({
          where: { id: item.id },
          data: { score: newScore, rank: newRank }
        })
      }
    })

    return NextResponse.json({
      completed: true,
      finalRank
    })
  }

  const nextComparison = existingInBucket.find(
    r => r.titleId === nextState.currentComparisons[nextState.comparisonIndex].titleId
  )

  return NextResponse.json({
    completed: false,
    comparisonState: nextState,
    compareWith: {
      id: nextComparison!.title.id,
      title: nextComparison!.title.title,
      posterUrl: nextComparison!.title.posterUrl,
      year: nextComparison!.title.year,
      type: nextComparison!.title.type
    }
  })
}
