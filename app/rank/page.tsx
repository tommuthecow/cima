'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Title {
  id?: string
  tmdbId?: number
  title: string
  posterUrl: string | null
  year: number | null
  type: 'movie' | 'tv'
  genres?: string[]
}

interface Ranking {
  id: string
  bucket: string
  rank: number
  score: number
  title: Title
}

export default function RankPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams?.get('tab') || 'search'

  const [tab, setTab] = useState<'search' | 'rankings' | 'watchlist'>(initialTab as any)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Title[]>([])
  const [searching, setSearching] = useState(false)
  const [rankings, setRankings] = useState<{ liked: Ranking[], fine: Ranking[], disliked: Ranking[] }>({
    liked: [],
    fine: [],
    disliked: []
  })
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null)
  const [bucket, setBucket] = useState<'liked' | 'fine' | 'disliked' | null>(null)
  const [comparing, setComparing] = useState(false)
  const [comparisonState, setComparisonState] = useState<any>(null)
  const [compareWith, setCompareWith] = useState<Title | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')

  useEffect(() => {
    if (tab === 'rankings') {
      loadRankings()
    } else if (tab === 'watchlist') {
      loadWatchlist()
    }
  }, [tab])

  const loadRankings = async () => {
    const res = await fetch('/api/rankings')
    const data = await res.json()
    setRankings(data.rankings)
  }

  const loadWatchlist = async () => {
    const res = await fetch('/api/watchlist')
    const data = await res.json()
    setWatchlist(data.watchlist)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await fetch(`/api/titles/search?q=${encodeURIComponent(searchQuery)}&type=${typeFilter}`)
      const data = await res.json()
      setSearchResults(data.results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectTitle = (title: Title) => {
    setSelectedTitle(title)
    setBucket(null)
  }

  const handleSelectBucket = async (selectedBucket: 'liked' | 'fine' | 'disliked') => {
    if (!selectedTitle) return

    setBucket(selectedBucket)
    setComparing(true)

    try {
      const titleData = {
        title: selectedTitle.title,
        tmdbId: selectedTitle.tmdbId,
        posterUrl: selectedTitle.posterUrl,
        year: selectedTitle.year,
        type: selectedTitle.type,
        genres: selectedTitle.genres
      }

      let titleId = selectedTitle.id

      if (!titleId) {
        const createRes = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(titleData)
        })
        const createData = await createRes.json()
        titleId = createData.titleId
      }

      const res = await fetch('/api/rankings/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleId, bucket: selectedBucket })
      })

      const data = await res.json()

      if (data.error) {
        alert(data.error)
        setComparing(false)
        return
      }

      if (data.completed) {
        alert('Ranking saved!')
        setSelectedTitle(null)
        setBucket(null)
        setComparing(false)
        setComparisonState(null)
        setCompareWith(null)
        if (tab === 'rankings') {
          loadRankings()
        }
      } else {
        setComparisonState(data.comparisonState)
        setCompareWith(data.compareWith)
      }
    } catch (error) {
      console.error('Error starting ranking:', error)
      setComparing(false)
    }
  }

  const handleComparison = async (preferNew: boolean) => {
    if (!comparisonState) return

    try {
      const res = await fetch('/api/rankings/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comparisonState,
          userPreferredNew: preferNew
        })
      })

      const data = await res.json()

      if (data.completed) {
        alert('Ranking complete!')
        setSelectedTitle(null)
        setBucket(null)
        setComparing(false)
        setComparisonState(null)
        setCompareWith(null)
        if (tab === 'rankings') {
          loadRankings()
        }
      } else {
        setComparisonState(data.comparisonState)
        setCompareWith(data.compareWith)
      }
    } catch (error) {
      console.error('Error comparing:', error)
    }
  }

  const handleAddToWatchlist = async (title: Title) => {
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.title,
          tmdbId: title.tmdbId,
          posterUrl: title.posterUrl,
          year: title.year,
          type: title.type,
          genres: title.genres
        })
      })
      alert('Added to watchlist!')
    } catch (error) {
      console.error('Error adding to watchlist:', error)
    }
  }

  const handleDeleteRanking = async (rankingId: string) => {
    if (!confirm('Remove this ranking?')) return

    try {
      await fetch('/api/rankings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingId })
      })
      loadRankings()
    } catch (error) {
      console.error('Error deleting ranking:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-2xl font-bold text-white">
              🎬 Cima
            </Link>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Home
              </Link>
              <Link
                href="/rank"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg"
              >
                Rank
              </Link>
              <Link
                href="/friends"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Friends
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {comparing && selectedTitle && bucket ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Which did you prefer?
              </h2>
              <p className="text-slate-300">Bucket: <span className="capitalize font-medium">{bucket}</span></p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <button
                onClick={() => handleComparison(true)}
                className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border-2 border-slate-700 hover:border-purple-500 transition-all transform hover:scale-105"
              >
                <div className="aspect-[2/3] mb-4">
                  {selectedTitle.posterUrl ? (
                    <img
                      src={selectedTitle.posterUrl}
                      alt={selectedTitle.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 rounded-lg flex items-center justify-center">
                      <span className="text-6xl">🎬</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedTitle.title}</h3>
                <p className="text-slate-400">{selectedTitle.year} • {selectedTitle.type}</p>
              </button>

              {compareWith && (
                <button
                  onClick={() => handleComparison(false)}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border-2 border-slate-700 hover:border-purple-500 transition-all transform hover:scale-105"
                >
                  <div className="aspect-[2/3] mb-4">
                    {compareWith.posterUrl ? (
                      <img
                        src={compareWith.posterUrl}
                        alt={compareWith.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 rounded-lg flex items-center justify-center">
                        <span className="text-6xl">🎬</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{compareWith.title}</h3>
                  <p className="text-slate-400">{compareWith.year} • {compareWith.type}</p>
                </button>
              )}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setComparing(false)
                  setSelectedTitle(null)
                  setBucket(null)
                  setComparisonState(null)
                  setCompareWith(null)
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Skip / Too Close
              </button>
            </div>
          </div>
        ) : selectedTitle && !bucket ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                How did you feel about this?
              </h2>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700 inline-block">
                <div className="flex items-center gap-4">
                  {selectedTitle.posterUrl && (
                    <img
                      src={selectedTitle.posterUrl}
                      alt={selectedTitle.title}
                      className="w-24 h-36 object-cover rounded"
                    />
                  )}
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">{selectedTitle.title}</h3>
                    <p className="text-slate-400">{selectedTitle.year} • {selectedTitle.type}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => handleSelectBucket('liked')}
                className="bg-green-600/20 hover:bg-green-600/30 border-2 border-green-600 rounded-xl p-8 transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">💚</div>
                <div className="text-xl font-bold text-white mb-2">Liked it</div>
                <div className="text-sm text-slate-300">Score: 6.7 - 10.0</div>
              </button>

              <button
                onClick={() => handleSelectBucket('fine')}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 border-2 border-yellow-600 rounded-xl p-8 transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">🤷</div>
                <div className="text-xl font-bold text-white mb-2">It was fine</div>
                <div className="text-sm text-slate-300">Score: 3.4 - 6.6</div>
              </button>

              <button
                onClick={() => handleSelectBucket('disliked')}
                className="bg-red-600/20 hover:bg-red-600/30 border-2 border-red-600 rounded-xl p-8 transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-4">👎</div>
                <div className="text-xl font-bold text-white mb-2">Didn't like it</div>
                <div className="text-sm text-slate-300">Score: 0.0 - 3.3</div>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setSelectedTitle(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setTab('search')}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  tab === 'search'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Search & Rank
              </button>
              <button
                onClick={() => setTab('rankings')}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  tab === 'rankings'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                My Rankings
              </button>
              <button
                onClick={() => setTab('watchlist')}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  tab === 'watchlist'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Watchlist
              </button>
            </div>

            {tab === 'search' && (
              <div>
                <div className="max-w-3xl mx-auto mb-8">
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700">
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search movies and shows..."
                        className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                      >
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {['all', 'movie', 'tv'].map(type => (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            typeFilter === type
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV Shows'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {searchResults.map((title, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/50 backdrop-blur-xl rounded-lg border border-slate-700 overflow-hidden group hover:border-purple-500 transition-all"
                    >
                      <div className="aspect-[2/3] relative">
                        {title.posterUrl ? (
                          <img
                            src={title.posterUrl}
                            alt={title.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                            <span className="text-5xl">🎬</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">
                          {title.title}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3">
                          {title.year} • {title.type}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSelectTitle(title)}
                            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Rank
                          </button>
                          <button
                            onClick={() => handleAddToWatchlist(title)}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                            title="Add to watchlist"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {searchResults.length === 0 && searchQuery && !searching && (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No results found</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'rankings' && (
              <div className="space-y-8">
                {(['liked', 'fine', 'disliked'] as const).map((bucketName) => (
                  <div key={bucketName}>
                    <h2 className="text-2xl font-bold text-white mb-4 capitalize flex items-center gap-3">
                      {bucketName === 'liked' && '💚 Liked'}
                      {bucketName === 'fine' && '🤷 It was fine'}
                      {bucketName === 'disliked' && '👎 Didn't like'}
                      <span className="text-sm text-slate-400 font-normal">
                        ({rankings[bucketName].length})
                      </span>
                    </h2>
                    {rankings[bucketName].length > 0 ? (
                      <div className="space-y-3">
                        {rankings[bucketName].map((ranking, idx) => (
                          <div
                            key={ranking.id}
                            className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-4 border border-slate-700 flex items-center gap-4"
                          >
                            <div className="text-2xl font-bold text-slate-500 w-8 text-center">
                              {idx + 1}
                            </div>
                            {ranking.title.posterUrl && (
                              <img
                                src={ranking.title.posterUrl}
                                alt={ranking.title.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-white text-lg">
                                {ranking.title.title}
                              </div>
                              <div className="text-sm text-slate-400">
                                {ranking.title.year} • {ranking.title.type}
                              </div>
                            </div>
                            <div className="text-right mr-4">
                              <div className="text-3xl font-bold text-purple-400">
                                {ranking.score.toFixed(1)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteRanking(ranking.id)}
                              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-8 border border-slate-700 text-center">
                        <p className="text-slate-400">No rankings in this bucket yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'watchlist' && (
              <div>
                {watchlist.length > 0 ? (
                  <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {watchlist.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-lg border border-slate-700 overflow-hidden group hover:border-purple-500 transition-all"
                      >
                        <div className="aspect-[2/3] relative">
                          {item.title.posterUrl ? (
                            <img
                              src={item.title.posterUrl}
                              alt={item.title.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                              <span className="text-5xl">🎬</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">
                            {item.title.title}
                          </h3>
                          <p className="text-xs text-slate-400 mb-3">
                            {item.title.year} • {item.title.type}
                          </p>
                          <button
                            onClick={() => handleSelectTitle(item.title)}
                            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Rank Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-12 border border-slate-700 text-center">
                    <p className="text-slate-400 mb-4">Your watchlist is empty</p>
                    <button
                      onClick={() => setTab('search')}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Search Titles
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
