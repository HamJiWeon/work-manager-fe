'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, getPendingRegistration, restoreSession } from '@/lib/auth'
import { AuthStatus } from './auth-status'

const SIGNUP_REQUIRED = 'SIGNUP_REQUIRED'
const LOGIN_COMPLETE = 'LOGIN_COMPLETE'
const LOGIN_ERROR_PATH = '/login?error=oauth'

/** 신규 가입은 가입 화면으로 안내하고, 가입 정보가 없다는 401은 로그인 인증을 복원해 기존 회원 여부를 확인한다. */
export function OAuthCallback() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    const handleCallback = async () => {
      try {
        const status = new URLSearchParams(window.location.search).get('status')
        if (status === SIGNUP_REQUIRED) { router.replace('/signup'); return }
        if (status !== null && status !== LOGIN_COMPLETE) throw new AuthError(401)
        if (status === null) {
          try {
            const pending = await getPendingRegistration()
            if (!active) return
            if (pending) { router.replace('/signup'); return }
          } catch (cause) {
            if (!(cause instanceof AuthError) || cause.status !== 401) throw cause
          }
          if (!active) return
        }
        await restoreSession()
        if (active) router.replace('/workspace')
      } catch (cause) {
        if (!active) return
        if (cause instanceof AuthError && cause.status === 401) {
          router.replace(LOGIN_ERROR_PATH)
        } else {
          setError('로그인 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      }
    }
    void handleCallback()
    return () => { active = false }
  }, [router, attempt])
  return <AuthStatus error={error} onRetry={() => { setError(''); setAttempt(value => value + 1) }} />
}
