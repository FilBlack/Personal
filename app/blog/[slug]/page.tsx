import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Markdown } from '@/utils/markdown'
import CommentTree from '@/components/CommentTree'
import CommentForm from '@/components/CommentForm'
import { formatDate } from '@/utils/formatDate'
import EditButton from '@/components/EditButton'

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  let isSuperUser = false
  
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    isSuperUser = profile?.is_admin === true
  }
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    notFound()
  }

  // Get images for this post
  const { data: images } = await supabase
    .from('blog_post_images')
    .select('*')
    .eq('post_id', post.id)
  
  // Sort images by order manually (order is a reserved keyword)
  const sortedImages = images ? [...images].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : []

  // Split content by image insertion points
  const contentSections: Array<{ type: 'text' | 'image'; content?: string; imageUrl?: string; caption?: string }> = []
  const contentLines = post.content.split('\n')
  let currentText = ''
  let imageIndex = 0

  for (const line of contentLines) {
    if (line.trim() === '[IMAGE]' && sortedImages && sortedImages[imageIndex]) {
      if (currentText.trim()) {
        contentSections.push({ type: 'text', content: currentText.trim() })
        currentText = ''
      }
      contentSections.push({
        type: 'image',
        imageUrl: sortedImages[imageIndex].image_url,
        caption: sortedImages[imageIndex].caption || undefined,
      })
      imageIndex++
    } else {
      currentText += line + '\n'
    }
  }
  if (currentText.trim()) {
    contentSections.push({ type: 'text', content: currentText.trim() })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <article>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">{post.title}</h1>
            <p className="text-gray-600">{formatDate(post.created_at)}</p>
          </div>
          {isSuperUser && (
            <EditButton slug={slug} />
          )}
        </div>
        
        {post.featured_image_url && (
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          {contentSections.map((section, index) => {
            if (section.type === 'image') {
              return (
                <div key={index} className="my-8">
                  <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={section.imageUrl!}
                      alt={section.caption || 'Blog post image'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {section.caption && (
                    <p className="text-sm text-gray-500 text-center mt-2 italic">
                      {section.caption}
                    </p>
                  )}
                </div>
              )
            } else {
              return <Markdown key={index} content={section.content || ''} />
            }
          })}
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-black mb-6">Comments</h2>
        <CommentForm postId={post.id} />
        <div className="mt-8">
          <CommentTree postId={post.id} />
        </div>
      </div>
    </div>
  )
}

