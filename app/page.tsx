import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-black mb-6">
          Welcome to My Blog
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A place where I share my thoughts, projects, and random musings.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/blog"
            className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Read Blog
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 border-2 border-black rounded hover:bg-gray-50 transition-colors"
          >
            About Me
          </Link>
        </div>
      </div>
    </div>
  )
}
