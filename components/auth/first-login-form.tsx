'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FirstLoginFormProps {
  userId: string
}

type Step = 'password' | 'profile' | 'complete'

export function FirstLoginForm({ userId }: FirstLoginFormProps) {
  const [step, setStep] = useState<Step>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const router = useRouter()

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Profile completion state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileError, setProfileError] = useState<string | null>(null)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setPasswordError(null)

    // Validation
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setPasswordError(error.message)
        setLoading(false)
        return
      }

      // Update profile to mark password as changed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_temporary_password: false,
          password_changed_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (profileError) {
        setPasswordError('Failed to update profile')
        setLoading(false)
        return
      }

      setStep('profile')
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'An error occurred'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileCompletion(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setProfileError(null)

    try {
      const supabase = createClient()

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        setProfileError('Failed to update profile')
        setLoading(false)
        return
      }

      // Update setup status
      await supabase
        .from('user_setup_status')
        .update({
          profile_completed: true,
        })
        .eq('user_id', userId)

      setStep('complete')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'An error occurred'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSkipProfile() {
    setLoading(true)
    setShowWarning(false)
    
    try {
      const supabase = createClient()
      
      // Just update setup status
      await supabase
        .from('user_setup_status')
        .update({
          profile_completed: true,
        })
        .eq('user_id', userId)

      setStep('complete')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'An error occurred'
      )
    } finally {
      setLoading(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              Setup Complete!
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'profile') {
    return (
      <form onSubmit={handleProfileCompletion} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name (Optional)</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name (Optional)</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your profile now or skip to access the dashboard. You can update it later.
          </AlertDescription>
        </Alert>

        {profileError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        )}

        {showWarning ? (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Skipping profile setup is allowed, but it's recommended to complete it for better account management.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Profile'
            )}
          </Button>
          <Button
            type="button"
            variant={showWarning ? 'destructive' : 'outline'}
            onClick={() => {
              if (!showWarning) {
                setShowWarning(true)
              } else {
                handleSkipProfile()
              }
            }}
            disabled={loading}
          >
            {showWarning ? 'Skip Anyway' : 'Skip'}
          </Button>
        </div>
      </form>
    )
  }

  // Password change step
  return (
    <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You are logging in for the first time. Please change your temporary password to a secure one.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Min. 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading}
          autoComplete="new-password"
        />
      </div>

      {passwordError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{passwordError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          'Change Password'
        )}
      </Button>
    </form>
  )
}
