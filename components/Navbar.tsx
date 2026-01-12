'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, isSuperUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      
      // Clear cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-access-token')
        localStorage.removeItem('sb-refresh-token')
        localStorage.clear() // Clear all Supabase storage
      }
      
      // Force a full page reload to ensure all cookies and state are cleared
      window.location.href = '/'
    } catch (err: any) {
      console.error('Logout error:', err)
      // Force redirect even on error
      window.location.href = '/'
    }
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/about" className="text-xl font-bold text-black">
              Filip Černý
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/about" className="text-black hover:text-gray-600 transition-colors">
                About
              </Link>
              <Link href="/blog" className="text-black hover:text-gray-600 transition-colors">
                Blog
              </Link>
              <Link href="/misc" className="text-black hover:text-gray-600 transition-colors">
                Misc
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isSuperUser && (
              <Link 
                href="/blog/new" 
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors rounded"
              >
                New Post
              </Link>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-black hover:text-gray-600 transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 text-black hover:text-gray-600 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

