'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/formatDate'

interface Comment {
  id: string
  content: string
  author_id: string
  created_at: string
  parent_id: string | null
  author_username: string
  reply_count: number
}

interface CommentTreeProps {
  postId: string
  parentId?: string | null
  depth?: number
  onCommentAdded?: () => void
}

export default function CommentTree({ postId, parentId = null, depth = 0, onCommentAdded }: CommentTreeProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadComments()
  }, [postId, parentId, reloadKey])

  const loadComments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('comments')
        .select(`
          id,
          content,
          author_id,
          created_at,
          parent_id
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (parentId === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parentId)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error loading comments:', error)
        throw error
      }

      // Get all unique author IDs
      const authorIds = [...new Set((data || []).map(c => c.author_id))]
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', authorIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

      // Process comments and get reply counts
      const processedComments: Comment[] = []
      
      for (const comment of (data || [])) {
        // Get reply count
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', comment.id)

        processedComments.push({
          id: comment.id,
          content: comment.content,
          author_id: comment.author_id,
          created_at: comment.created_at,
          parent_id: comment.parent_id,
          author_username: profileMap.get(comment.author_id) || 'Anonymous',
          reply_count: count || 0,
        })
      }

      setComments(processedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !replyingTo || !replyContent.trim()) return

    setSubmitting(true)
    
    const contentToSubmit = replyContent.trim()
    const parentIdToSubmit = replyingTo
    setReplyContent('')
    setReplyingTo(null)

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_id: parentIdToSubmit,
          content: contentToSubmit,
        })

      if (error) throw error

      setReloadKey(prev => prev + 1)
      if (onCommentAdded) onCommentAdded()
    } catch (error) {
      console.error('Error submitting reply:', error)
      setReplyContent(contentToSubmit)
      setReplyingTo(parentIdToSubmit)
    } finally {
      setSubmitting(false)
    }
  }


  if (loading && depth === 0) {
    return <div className="text-gray-500 py-4">Loading comments...</div>
  }

  return (
    <div className={depth > 0 ? 'ml-8 border-l border-gray-200 pl-4' : ''}>
      {comments.map(comment => (
        <div key={comment.id} className="mb-4">
          <div className="border-l-2 border-gray-300 pl-4 py-2">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-semibold text-black text-sm">
                {comment.author_username}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
              </span>
            </div>

            <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
              {comment.content}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}</span>
              {user && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                </button>
              )}
            </div>

            {replyingTo === comment.id && (
              <form onSubmit={handleSubmitReply} className="mt-3 pt-3 border-t border-gray-200">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  required
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={submitting || !replyContent.trim()}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Nested comments */}
          <CommentTree 
            key={`${comment.id}-${reloadKey}`}
            postId={postId} 
            parentId={comment.id} 
            depth={depth + 1}
            onCommentAdded={onCommentAdded}
          />
        </div>
      ))}
    </div>
  )
}

