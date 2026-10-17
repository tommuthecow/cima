import { NextRequest, NextResponse } from 'next/server'
import { SEED_TITLES } from '@/lib/seed-data'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all'

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  if (TMDB_API_KEY) {
    try {
      const results = []
      
      if (type === 'all' || type === 'movie') {
        const movieRes = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        )
        const movieData = await movieRes.json()
        
        results.push(...movieData.results.slice(0, 10).map((item: any) => ({
          tmdbId: item.id,
          title: item.title,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          year: item.release_date ? new Date(item.release_date).getFullYear() : null,
          type: 'movie',
          genres: []
        })))
      }

      if (type === 'all' || type === 'tv') {
        const tvRes = await fetch(
          `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        )
        const tvData = await tvRes.json()
        
        results.push(...tvData.results.slice(0, 10).map((item: any) => ({
          tmdbId: item.id,
          title: item.name,
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
          type: 'tv',
          genres: []
        })))
      }

      return NextResponse.json({ results: results.slice(0, 20) })
    } catch (error) {
      console.error('TMDB API error, falling back to seed data:', error)
    }
  }

  const queryLower = query.toLowerCase()
  const filtered = SEED_TITLES.filter(title => {
    const matchesQuery = title.title.toLowerCase().includes(queryLower)
    const matchesType = type === 'all' || title.type === type
    return matchesQuery && matchesType
  }).slice(0, 20)

  return NextResponse.json({ results: filtered })
}
