'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSuperUser, setIsSuperUser] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
        }
        
        if (session?.user) {
          setUser(session.user)
          
          // Check if user is super user
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError)
          }
          
          setIsSuperUser(profile?.is_admin === true)
        } else {
          setUser(null)
          setIsSuperUser(false)
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        setUser(null)
        setIsSuperUser(false)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Update cookies when session changes
          if (typeof document !== 'undefined' && session.access_token && session.refresh_token) {
            document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`
            document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax`
          }
          
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
          
          setIsSuperUser(profile?.is_admin === true)
        } else {
          setIsSuperUser(false)
          // Clear cookies on logout
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return {
    user,
    loading,
    isSuperUser,
  }
}

