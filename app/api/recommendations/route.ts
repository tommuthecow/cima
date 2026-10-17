import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SEED_TITLES } from '@/lib/seed-data'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const topRankings = await prisma.ranking.findMany({
    where: {
      userId: session.user.id,
      bucket: 'liked'
    },
    include: {
      title: true
    },
    orderBy: {
      rank: 'asc'
    },
    take: 3
  })

  if (topRankings.length === 0) {
    return NextResponse.json({ recommendations: [] })
  }

  const recommendations: any[] = []

  if (TMDB_API_KEY) {
    for (const ranking of topRankings.slice(0, 2)) {
      if (!ranking.title.tmdbId) continue

      try {
        const endpoint = ranking.title.type === 'movie' ? 'movie' : 'tv'
        const res = await fetch(
          `${TMDB_BASE_URL}/${endpoint}/${ranking.title.tmdbId}/recommendations?api_key=${TMDB_API_KEY}`
        )
        const data = await res.json()

        recommendations.push(...data.results.slice(0, 5).map((item: any) => ({
          tmdbId: item.id,
          title: item.title || item.name,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          year: item.release_date ? new Date(item.release_date).getFullYear() : 
                item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
          type: ranking.title.type,
          reason: `Because you ranked "${ranking.title.title}" highly`,
          basedOn: ranking.title.title
        })))
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      }
    }
  } else {
    for (const ranking of topRankings) {
      const titleGenres = ranking.title.genres ? JSON.parse(ranking.title.genres) : []
      
      const similar = SEED_TITLES
        .filter(t => {
          if (t.type !== ranking.title.type) return false
          if (t.tmdbId === ranking.title.tmdbId) return false
          
          const tGenres = t.genres || []
          return tGenres.some(g => titleGenres.includes(g))
        })
        .slice(0, 3)

      recommendations.push(...similar.map(t => ({
        ...t,
        reason: `Because you ranked "${ranking.title.title}" highly`,
        basedOn: ranking.title.title
      })))
    }
  }

  const uniqueRecommendations = Array.from(
    new Map(recommendations.map(r => [r.tmdbId || r.title, r])).values()
  ).slice(0, 15)

  return NextResponse.json({ recommendations: uniqueRecommendations })
}
