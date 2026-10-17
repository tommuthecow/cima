'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  isFollowing: boolean
}

interface Activity {
  id: string
  type: string
  bucket: string
  score: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  title: {
    id: string
    title: string
    posterUrl: string | null
    year: number
    type: string
  }
}

export default function FriendsPage() {
  const searchParams = useSearchParams()
  const viewUserId = searchParams?.get('user')

  const [tab, setTab] = useState<'feed' | 'search' | 'profile'>(viewUserId ? 'profile' : 'feed')
  const [feed, setFeed] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewUser, setViewUser] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    if (tab === 'feed') {
      loadFeed()
    } else if (tab === 'search') {
      searchUsers()
    } else if (tab === 'profile' && viewUserId) {
      loadUserProfile(viewUserId)
    }
  }, [tab, viewUserId])

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadFeed = async () => {
    try {
      const res = await fetch('/api/social/feed')
      const data = await res.json()
      setFeed(data.feed)
    } catch (error) {
      console.error('Error loading feed:', error)
    }
  }

  const searchUsers = async () => {
    try {
      const url = searchQuery
        ? `/api/social/users?q=${encodeURIComponent(searchQuery)}`
        : '/api/social/users'
      const res = await fetch(url)
      const data = await res.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/social/users?userId=${userId}`)
      const data = await res.json()
      setViewUser(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations')
      const data = await res.json()
      setRecommendations(data.recommendations)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      searchUsers()
      if (viewUser && viewUser.user.id === userId) {
        loadUserProfile(userId)
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      await fetch('/api/social/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      searchUsers()
      if (viewUser && viewUser.user.id === userId) {
        loadUserProfile(userId)
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
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
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Rank
              </Link>
              <Link
                href="/friends"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg"
              >
                Friends
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTab('feed')}
            className={`px-6 py-3 font-medium rounded-lg transition-colors ${
              tab === 'feed'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setTab('search')}
            className={`px-6 py-3 font-medium rounded-lg transition-colors ${
              tab === 'search'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Find Friends
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {tab === 'feed' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Activity Feed</h2>
                {feed.length > 0 ? (
                  <div className="space-y-4">
                    {feed.map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-6 border border-slate-700"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="mb-3">
                              <Link
                                href={`/friends?user=${activity.user.id}`}
                                className="font-medium text-purple-400 hover:text-purple-300"
                              >
                                {activity.user.name}
                              </Link>
                              <span className="text-slate-400"> ranked </span>
                              <span className="font-medium text-white">{activity.title.title}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {activity.title.posterUrl && (
                                <img
                                  src={activity.title.posterUrl}
                                  alt={activity.title.title}
                                  className="w-20 h-30 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="text-sm text-slate-400 mb-2">
                                  {activity.title.year} • {activity.title.type}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="px-3 py-1 bg-slate-700 rounded-full text-sm capitalize text-slate-300">
                                    {activity.bucket === 'liked' && '💚 Liked'}
                                    {activity.bucket === 'fine' && '🤷 Fine'}
                                    {activity.bucket === 'disliked' && '👎 Disliked'}
                                  </div>
                                  <div className="text-2xl font-bold text-purple-400">
                                    {activity.score.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-slate-500 mt-3">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-12 border border-slate-700 text-center">
                    <p className="text-slate-400 mb-4">No activity yet</p>
                    <p className="text-slate-500 text-sm mb-6">
                      Follow friends to see their rankings here
                    </p>
                    <button
                      onClick={() => setTab('search')}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Find Friends
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'search' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Find Friends</h2>
                
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700 mb-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                      placeholder="Search by name or email..."
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={searchUsers}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-4 border border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/friends?user=${user.id}`}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
                        >
                          View
                        </Link>
                        {user.isFollowing ? (
                          <button
                            onClick={() => handleUnfollow(user.id)}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded transition-colors"
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFollow(user.id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Follow
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'profile' && viewUser && (
              <div>
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-6 border border-slate-700 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{viewUser.user.name}</h2>
                      <p className="text-slate-400">{viewUser.user.email}</p>
                    </div>
                    {viewUser.isFollowing ? (
                      <button
                        onClick={() => handleUnfollow(viewUser.user.id)}
                        className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors"
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(viewUser.user.id)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Follow
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {viewUser.rankings.liked.length}
                      </div>
                      <div className="text-sm text-slate-400">Liked</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {viewUser.rankings.fine.length}
                      </div>
                      <div className="text-sm text-slate-400">Fine</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {viewUser.rankings.disliked.length}
                      </div>
                      <div className="text-sm text-slate-400">Disliked</div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4">
                  {viewUser.user.name}'s Rankings
                </h3>

                {viewUser.rankings.liked.length + viewUser.rankings.fine.length + viewUser.rankings.disliked.length > 0 ? (
                  <div className="space-y-6">
                    {(['liked', 'fine', 'disliked'] as const).map((bucket) => (
                      viewUser.rankings[bucket].length > 0 && (
                        <div key={bucket}>
                          <h4 className="text-lg font-medium text-white mb-3 capitalize flex items-center gap-2">
                            {bucket === 'liked' && '💚 Liked'}
                            {bucket === 'fine' && '🤷 It was fine'}
                            {bucket === 'disliked' && '👎 Didn't like'}
                            <span className="text-sm text-slate-400 font-normal">
                              ({viewUser.rankings[bucket].length})
                            </span>
                          </h4>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                            {viewUser.rankings[bucket].slice(0, 12).map((ranking: any) => (
                              <div key={ranking.id} className="relative group">
                                {ranking.title.posterUrl ? (
                                  <img
                                    src={ranking.title.posterUrl}
                                    alt={ranking.title.title}
                                    className="w-full aspect-[2/3] object-cover rounded border border-slate-700"
                                  />
                                ) : (
                                  <div className="w-full aspect-[2/3] bg-slate-700 rounded flex items-center justify-center">
                                    <span className="text-3xl">🎬</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center p-2">
                                  <p className="text-white text-xs text-center font-medium mb-1">
                                    {ranking.title.title}
                                  </p>
                                  <p className="text-purple-400 font-bold text-lg">
                                    {ranking.score.toFixed(1)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-8 border border-slate-700 text-center">
                    <p className="text-slate-400">No rankings yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Recommendations</h3>
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex gap-3">
                      {rec.posterUrl && (
                        <img
                          src={rec.posterUrl}
                          alt={rec.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm mb-1">
                          {rec.title}
                        </h4>
                        <p className="text-xs text-slate-400 mb-2">
                          {rec.year} • {rec.type}
                        </p>
                        {rec.reason && (
                          <p className="text-xs text-purple-400">
                            {rec.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-6 border border-slate-700 text-center">
                <p className="text-slate-400 text-sm">
                  Rank some titles to get recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
