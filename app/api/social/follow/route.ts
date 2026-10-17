import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await request.json()

  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: userId
      }
    }
  })

  if (existing) {
    return NextResponse.json({ message: 'Already following' })
  }

  await prisma.follow.create({
    data: {
      followerId: session.user.id,
      followingId: userId
    }
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: userId
      }
    }
  })

  return NextResponse.json({ success: true })
}
