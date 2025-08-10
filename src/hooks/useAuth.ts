import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(async (error) => {
      console.warn('Session retrieval failed, clearing invalid tokens:', error)
      try {
        await supabase.auth.signOut()
      } catch (signOutError: any) {
        if (signOutError.message?.includes('Session from session_id claim in JWT does not exist')) {
          console.info('Invalid session cleared successfully - no active session to sign out')
        } else {
          console.warn('Sign out error:', signOutError)
        }
      }
      setUser(null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    // If the session doesn't exist, treat it as a successful logout
    if (error?.message?.includes('Session from session_id claim in JWT does not exist')) {
      // Session is already invalid, so we're effectively logged out
      setUser(null)
      return { error: null }
    }
    
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}