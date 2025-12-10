'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function EditPostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [images, setImages] = useState<Array<{ id?: string; url: string; caption: string; order: number }>>([])
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { user, isSuperUser, loading: authLoading } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && (!user || !isSuperUser)) {
      router.push('/blog')
    }
  }, [user, isSuperUser, authLoading, router])

  useEffect(() => {
    if (slug && user && isSuperUser) {
      loadPost()
    }
  }, [slug, user, isSuperUser])

  const loadPost = async () => {
    setLoadingPost(true)
    try {
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (postError) throw postError

      if (!post) {
        throw new Error('Post not found')
      }

      const postData = post as any
      setTitle(postData.title)
      setContent(postData.content)
      setFeaturedImageUrl(postData.featured_image_url || '')
      setExcerpt(postData.excerpt || '')

      // Load images
      const { data: postImages, error: imagesError } = await supabase
        .from('blog_post_images')
        .select('*')
        .eq('post_id', postData.id)
      
      if (imagesError) {
        console.error('Error loading images:', imagesError)
        // Continue without images if there's an error
      }
      
      // Sort images by order manually if query succeeded (order is a reserved keyword)
      const sortedImages = postImages ? [...postImages].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : []

      if (sortedImages && sortedImages.length > 0) {
        setImages(sortedImages.map((img: any) => ({
          id: img.id,
          url: img.image_url,
          caption: img.caption || '',
          order: img.order || 0,
        })))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load post')
    } finally {
      setLoadingPost(false)
    }
  }

  const handleAddImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      const caption = prompt('Enter caption (optional):') || ''
      setImages([...images, { url, caption, order: images.length }])
      setContent(content + '\n[IMAGE]\n')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isSuperUser) return

    setLoading(true)
    setError('')

    try {
      // Get post ID first
      const { data: post } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!post) throw new Error('Post not found')

      const postId = (post as any).id

      // Update blog post
      const { error: postError } = await (supabase
        .from('blog_posts') as any)
        .update({
          title,
          content,
          excerpt: excerpt || null,
          featured_image_url: featuredImageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

      if (postError) throw postError

      // Delete existing images
      await supabase
        .from('blog_post_images')
        .delete()
        .eq('post_id', postId)

      // Insert new images
      if (images.length > 0) {
        const imageInserts = images.map((img, index) => ({
          post_id: postId,
          image_url: img.url,
          caption: img.caption || null,
          "order": index, // Quote order since it's a reserved keyword
        }))

        const { error: imageError } = await supabase
          .from('blog_post_images')
          .insert(imageInserts as any)

        if (imageError) throw imageError
      }

      router.push(`/blog/${slug}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update post')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16">Loading authentication...</div>
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="border border-yellow-300 bg-yellow-50 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold mb-2">Not logged in</p>
          <p className="mb-4">Please log in to edit posts.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!isSuperUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded">
          <p className="font-bold mb-2">Unauthorized</p>
          <p className="mb-4">You don't have permission to edit posts.</p>
          <button
            onClick={() => router.push('/blog')}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Back to Blog
          </button>
        </div>
      </div>
    )
  }

  if (loadingPost) {
    return <div className="max-w-4xl mx-auto px-4 py-16">Loading post...</div>
  }

  if (error && !title) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded">
          <p className="font-bold mb-2">Error loading post:</p>
          <p>{error}</p>
          <button
            onClick={() => router.push('/blog')}
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Back to Blog
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-black mb-8">Edit Blog Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2 text-black">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium mb-2 text-black">
            Excerpt (optional)
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        <div>
          <label htmlFor="featuredImage" className="block text-sm font-medium mb-2 text-black">
            Featured Image URL (optional)
          </label>
          <input
            id="featuredImage"
            type="url"
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
          />
          {featuredImageUrl && (
            <div className="mt-2 relative w-full h-48 rounded overflow-hidden bg-gray-100">
              <Image src={featuredImageUrl} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="block text-sm font-medium text-black">
              Content
            </label>
            <button
              type="button"
              onClick={handleAddImage}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Add Image
            </button>
          </div>
          <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
            <p className="font-semibold mb-1">How to insert images:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Click "Add Image" button to add an image URL</li>
              <li>Type <code className="bg-white px-1 rounded">[IMAGE]</code> on its own line in your content where you want the image to appear</li>
              <li>Images will be inserted in the order you added them, matching the order of <code className="bg-white px-1 rounded">[IMAGE]</code> markers</li>
            </ol>
            <p className="mt-2 text-xs italic">Example: Write some text, then on a new line type [IMAGE], then continue writing.</p>
          </div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded text-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            placeholder="Write your blog post content here.&#10;&#10;Use [IMAGE] on its own line to insert images.&#10;&#10;Example:&#10;This is the first paragraph.&#10;&#10;[IMAGE]&#10;&#10;This is the second paragraph after the image."
          />
        </div>

        {images.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-black">Images to be inserted:</h3>
            <div className="space-y-2">
              {images.map((img, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                  <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                    <Image src={img.url} alt={`Image ${index + 1}`} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{img.caption || 'No caption'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Post'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/blog')}
            className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

