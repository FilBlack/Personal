import { createClient } from '@/lib/supabase/server'
import BlogPostCard from '@/components/BlogPostCard'

export default async function BlogPage() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-5xl font-bold text-black mb-12">Blog</h1>
      
      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post: any) => (
            <BlogPostCard
              key={post.id}
              id={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              featuredImageUrl={post.featured_image_url}
              createdAt={post.created_at}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-lg">No blog posts yet. Check back soon!</p>
      )}
    </div>
  )
}

