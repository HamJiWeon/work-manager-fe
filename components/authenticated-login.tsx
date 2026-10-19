'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { restoreSession } from '@/lib/auth'
import { LoginPage } from './login-page'

/** 로그인 화면에서도 기존 인증을 복원해 인증된 사용자를 워크스페이스로 이동시킨다. */
export function AuthenticatedLogin({ loginError }: { loginError: boolean }) {
  const router = useRouter()
  useEffect(() => {
    let active = true
    void restoreSession().then(() => {
      if (active) router.replace('/workspace')
    }).catch(() => {})
    return () => { active = false }
  }, [router])
  return <LoginPage backendUrl="/backend" loginError={loginError} />
}
