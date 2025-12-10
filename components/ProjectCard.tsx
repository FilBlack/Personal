import Image from 'next/image'
import Link from 'next/link'

interface ProjectCardProps {
  title: string
  description: string
  url: string
  imageUrl?: string
}

export default function ProjectCard({ title, description, url, imageUrl }: ProjectCardProps) {
  return (
    <Link 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
    >
      {imageUrl && (
        <div className="relative w-full h-48 bg-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  )
}

