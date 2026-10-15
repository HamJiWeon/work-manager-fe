'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, getPendingRegistration, restoreSession } from '@/lib/auth'
import { AuthStatus } from './auth-status'

const SIGNUP_REQUIRED = 'SIGNUP_REQUIRED'
const LOGIN_COMPLETE = 'LOGIN_COMPLETE'

/** 소셜 인증 후 신규 사용자는 가입 화면으로, 인증된 기존 사용자는 메인으로 이동한다. */
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
          const pending = await getPendingRegistration()
          if (!active) return
          if (pending) { router.replace('/signup'); return }
        }
        await restoreSession()
        if (active) router.replace('/workspace')
      } catch (cause) {
        if (!active) return
        if (cause instanceof AuthError && cause.status === 401) {
          setError('인증이 만료되었거나 취소되었습니다. 소셜 로그인을 다시 진행해 주세요.')
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
