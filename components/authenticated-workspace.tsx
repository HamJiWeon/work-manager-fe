'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthError, logout, restoreSession, type AuthUser } from '@/lib/auth'
import { MainPage } from './main-page'
import { AuthStatus } from './auth-status'
import styles from './auth-panel.module.css'

/** 인증을 복원한 후에만 워크스페이스를 표시하며 로그아웃 실패 시 재시도를 허용한다. */
export function AuthenticatedWorkspace({ today }: { today: string }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  useEffect(() => {
    let active = true
    restoreSession().then(currentUser => { if (active) setUser(currentUser) }).catch(cause => {
      if (!active) return
      if (cause instanceof AuthError && cause.status === 401) router.replace('/login')
      else setError('사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    })
    return () => { active = false }
  }, [router, attempt])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError('')
    try {
      await logout()
      setUser(null)
      router.replace('/login')
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 다시 시도해 주세요.')
    } finally { setLoggingOut(false) }
  }
  if (!user) return <AuthStatus error={error} onRetry={() => { setError(''); setAttempt(value => value + 1) }} />
  return <>
    {logoutError && <div role="alert" className={styles.notice}>{logoutError}<button type="button" disabled={loggingOut} onClick={handleLogout}>다시 시도</button></div>}
    <MainPage today={today} user={user} onLogout={handleLogout} loggingOut={loggingOut} />
  </>
}
