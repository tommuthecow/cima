import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const following = await prisma.follow.findMany({
    where: {
      followerId: session.user.id
    },
    select: {
      followingId: true
    }
  })

  const followingIds = following.map(f => f.followingId)

  if (followingIds.length === 0) {
    return NextResponse.json({ feed: [] })
  }

  const activities = await prisma.activity.findMany({
    where: {
      userId: {
        in: followingIds
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      title: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })

  return NextResponse.json({ feed: activities })
}
