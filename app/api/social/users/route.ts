import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const userId = searchParams.get('userId')

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId
        }
      }
    })

    const rankings = await prisma.ranking.findMany({
      where: { userId },
      include: { title: true },
      orderBy: [{ bucket: 'asc' }, { rank: 'asc' }],
      take: 50
    })

    return NextResponse.json({
      user,
      isFollowing: !!isFollowing,
      rankings: {
        liked: rankings.filter(r => r.bucket === 'liked'),
        fine: rankings.filter(r => r.bucket === 'fine'),
        disliked: rankings.filter(r => r.bucket === 'disliked')
      }
    })
  }

  const where: any = {
    id: {
      not: session.user.id
    }
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } }
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    },
    take: 20
  })

  const followingIds = await prisma.follow.findMany({
    where: {
      followerId: session.user.id,
      followingId: {
        in: users.map(u => u.id)
      }
    },
    select: {
      followingId: true
    }
  })

  const followingSet = new Set(followingIds.map(f => f.followingId))

  return NextResponse.json({
    users: users.map(u => ({
      ...u,
      isFollowing: followingSet.has(u.id)
    }))
  })
}
