import { createClient } from '@/lib/supabase/server'
import ProjectCard from '@/components/ProjectCard'

export default async function AboutPage() {
  const supabase = await createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('order', { ascending: true })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="mb-16">
        <h1 className="text-5xl font-bold text-black mb-6">About Me</h1>
        <div className="prose prose-lg max-w-3xl">
          <p className="text-xl text-gray-700 leading-relaxed">
            Hi, thanks for visiting my site. 
          </p>
        
        </div>
      </div>

      {/* Projects Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-black mb-8">My Projects</h2>
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                url={project.url}
                imageUrl={project.image_url}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No projects to display yet.</p>
        )}
      </div>
    </div>
  )
}

