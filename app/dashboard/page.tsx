import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SignOutButton } from '@/app/components/SignOutButton'

export default async function Dashboard() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }

  const rankings = await prisma.ranking.findMany({
    where: { userId: session.user.id },
    include: { title: true },
    orderBy: [{ bucket: 'asc' }, { rank: 'asc' }]
  })

  const watchlist = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    include: { title: true },
    take: 6
  })

  const following = await prisma.follow.count({
    where: { followerId: session.user.id }
  })

  const followers = await prisma.follow.count({
    where: { followingId: session.user.id }
  })

  const stats = {
    liked: rankings.filter(r => r.bucket === 'liked').length,
    fine: rankings.filter(r => r.bucket === 'fine').length,
    disliked: rankings.filter(r => r.bucket === 'disliked').length,
    total: rankings.length
  }

  const recentRankings = rankings.slice(0, 6)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-2xl font-bold text-white">
                🎬 Cima
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg"
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
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Friends
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">{session.user.name}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-slate-300">
            You've ranked {stats.total} titles so far
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-2">💚</div>
            <div className="text-2xl font-bold text-white">{stats.liked}</div>
            <div className="text-sm text-slate-400">Liked</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-2">🤷</div>
            <div className="text-2xl font-bold text-white">{stats.fine}</div>
            <div className="text-sm text-slate-400">It was fine</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-2">👎</div>
            <div className="text-2xl font-bold text-white">{stats.disliked}</div>
            <div className="text-sm text-slate-400">Didn't like</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-2xl font-bold text-white">{following}</div>
            <div className="text-sm text-slate-400">Following</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Recent Rankings</h2>
              <Link href="/rank" className="text-purple-400 hover:text-purple-300 text-sm">
                View all →
              </Link>
            </div>
            {recentRankings.length > 0 ? (
              <div className="space-y-3">
                {recentRankings.map((ranking) => (
                  <div
                    key={ranking.id}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-4 border border-slate-700 flex items-center gap-4"
                  >
                    {ranking.title.posterUrl && (
                      <img
                        src={ranking.title.posterUrl}
                        alt={ranking.title.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-white">{ranking.title.title}</div>
                      <div className="text-sm text-slate-400">
                        {ranking.title.year} • {ranking.title.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-400">
                        {ranking.score.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">{ranking.bucket}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-8 border border-slate-700 text-center">
                <p className="text-slate-400 mb-4">No rankings yet</p>
                <Link
                  href="/rank"
                  className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Start Ranking
                </Link>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Watchlist</h2>
              <Link href="/rank?tab=watchlist" className="text-purple-400 hover:text-purple-300 text-sm">
                View all →
              </Link>
            </div>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {watchlist.map((item) => (
                  <div key={item.id} className="relative group">
                    {item.title.posterUrl ? (
                      <img
                        src={item.title.posterUrl}
                        alt={item.title.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg border border-slate-700"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-slate-700 rounded-lg flex items-center justify-center">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2">
                      <p className="text-white text-sm text-center font-medium">
                        {item.title.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-8 border border-slate-700 text-center">
                <p className="text-slate-400">Your watchlist is empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
