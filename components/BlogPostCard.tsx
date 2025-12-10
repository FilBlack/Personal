import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/utils/formatDate'

interface BlogPostCardProps {
  id: string
  slug: string
  title: string
  excerpt?: string
  featuredImageUrl?: string
  createdAt: string
}

export default function BlogPostCard({ slug, title, excerpt, featuredImageUrl, createdAt }: BlogPostCardProps) {
  return (
    <Link 
      href={`/blog/${slug}`}
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
    >
      {featuredImageUrl && (
        <div className="relative w-full h-64 bg-gray-100">
          <Image
            src={featuredImageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>
        {excerpt && (
          <p className="text-gray-600 mb-3 line-clamp-3">{excerpt}</p>
        )}
        <p className="text-sm text-gray-500">{formatDate(createdAt)}</p>
      </div>
    </Link>
  )
}

