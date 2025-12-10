'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CommentFormProps {
  postId: string
  onCommentAdded?: () => void
}

export default function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setSubmitting(true)
    const contentToSubmit = content.trim()
    setContent('')

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_id: null,
          content: contentToSubmit,
        } as any)

      if (error) throw error

      // Always reload to show new comment
      window.location.reload()
    } catch (error) {
      console.error('Error adding comment:', error)
      setContent(contentToSubmit)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
        <p className="text-gray-600 mb-4">Please log in to leave a comment.</p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Log In
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black resize-none"
        required
      />
      <div className="mt-3">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}

