'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { restoreSession } from '@/lib/auth'
import { LoginPage } from './login-page'

/** OAuth 오류 안내를 유지하고 오류 없는 로그인 진입에서만 기존 인증을 복원해 워크스페이스로 이동한다. */
export function AuthenticatedLogin({ loginError }: { loginError: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (loginError) return
    let active = true
    void restoreSession().then(() => {
      if (active) router.replace('/workspace')
    }).catch(() => {})
    return () => { active = false }
  }, [router, loginError])
  return <LoginPage backendUrl="/backend" loginError={loginError} />
}
