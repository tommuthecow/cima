import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-white mb-4">
              🎬 Cima
            </h1>
            <p className="text-2xl text-slate-300 mb-8">
              Rank movies and shows by comparison, not stars
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border border-slate-700 mb-12">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div>
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Pick a Bucket</h3>
                <p className="text-slate-300">Liked it, It was fine, or Didn't like it</p>
              </div>
              <div>
                <div className="text-4xl mb-4">⚔️</div>
                <h3 className="text-xl font-bold text-white mb-2">Compare</h3>
                <p className="text-slate-300">Which did you prefer? Just a few quick picks</p>
              </div>
              <div>
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Get Your List</h3>
                <p className="text-slate-300">Personal ranked scores from 0-10</p>
              </div>
            </div>

            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>

          <div className="text-slate-400 text-sm">
            Inspired by Beli's ranking approach for restaurants
          </div>
        </div>
      </div>
    </div>
  )
}
