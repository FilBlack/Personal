import Link from 'next/link'

interface EditButtonProps {
  slug: string
}

export default function EditButton({ slug }: EditButtonProps) {
  return (
    <Link
      href={`/blog/edit/${slug}`}
      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
    >
      Edit
    </Link>
  )
}

