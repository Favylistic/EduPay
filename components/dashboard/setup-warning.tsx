'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function SetupWarning() {
  const [setupStatus, setSetupStatus] = useState<{
    passwordChanged: boolean
    profileCompleted: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const supabase = await createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Check user profile for setup status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_temporary_password, password_changed_at, profile_completed_at')
          .eq('id', user.id)
          .single()

        if (profile) {
          setSetupStatus({
            passwordChanged: !profile.is_temporary_password && !!profile.password_changed_at,
            profileCompleted: !!profile.profile_completed_at,
          })
        }

        setLoading(false)
      } catch (error) {
        console.error('[v0] Error checking setup status:', error)
        setLoading(false)
      }
    }

    checkSetupStatus()
  }, [])

  if (loading || !setupStatus) {
    return null
  }

  const passwordChanged = setupStatus.passwordChanged
  const profileCompleted = setupStatus.profileCompleted
  const setupComplete = passwordChanged && profileCompleted

  if (setupComplete) {
    return null
  }

  const pendingItems = []
  if (!passwordChanged) {
    pendingItems.push({
      title: 'Change Password',
      description: 'You are using a temporary password. Please change it immediately.',
      action: '/auth/first-login',
    })
  }
  if (!profileCompleted) {
    pendingItems.push({
      title: 'Complete Profile',
      description: 'Finish setting up your profile to fully activate your account.',
      action: '/auth/first-login',
    })
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
            Account Setup Incomplete
          </h3>

          <div className="space-y-2">
            {pendingItems.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">{item.title}</p>
                  <p className="text-amber-800 dark:text-amber-200 text-xs mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}

            {passwordChanged && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">Password Changed</p>
                </div>
              </div>
            )}

            {profileCompleted && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">Profile Completed</p>
                </div>
              </div>
            )}
          </div>

          {!setupComplete && (
            <Link
              href="/auth/first-login"
              className="inline-block mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors dark:bg-amber-700 dark:hover:bg-amber-600"
            >
              Complete Setup
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
