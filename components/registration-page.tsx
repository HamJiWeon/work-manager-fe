'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthError, completeRegistration, getPendingRegistration, restoreSession, type PendingRegistration } from '@/lib/auth'
import { AuthStatus } from './auth-status'
import styles from './auth-panel.module.css'

/** 임시 가입 쿠키로 약관을 조회하고 필수 동의를 확인한 뒤 회원가입을 요청한다. */
export function RegistrationPage() {
  const router = useRouter()
  const [registration, setRegistration] = useState<PendingRegistration | null>(null)
  const [agreements, setAgreements] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const requiredAgreed = registration?.terms.every(term => !term.required || agreements[term.id]) ?? false

  useEffect(() => {
    let active = true
    getPendingRegistration().then(pending => {
      if (!active) return
      if (!pending) { setLoadError('진행 중인 가입 정보가 없습니다. 소셜 로그인을 먼저 진행해 주세요.'); return }
      setRegistration(pending)
    }).catch(cause => {
      if (!active) return
      setLoadError(cause instanceof AuthError && cause.status === 401
        ? '가입 시간이 만료되었습니다. 소셜 로그인을 다시 진행해 주세요.'
        : '가입 안내를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    })
    return () => { active = false }
  }, [attempt])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!registration || !requiredAgreed || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await completeRegistration(registration.terms.map(term => ({
        id: term.id, version: term.version, agreed: Boolean(agreements[term.id]),
      })))
    } catch (cause) {
      setError(cause instanceof AuthError && cause.status === 401
        ? '가입 시간이 만료되었습니다. 소셜 로그인을 다시 진행해 주세요.'
        : '가입 요청을 완료하지 못했습니다. 동의 내용을 확인한 뒤 다시 시도해 주세요.')
      setSubmitting(false)
      return
    }
    try {
      await restoreSession()
      router.replace('/workspace')
    } catch {
      router.replace('/oauth/callback')
    }
  }

  if (!registration) return <AuthStatus error={loadError} onRetry={() => { setLoadError(''); setAttempt(value => value + 1) }} />
  return <main className={styles.panel}>
    <span>JOIN WORK MANAGER</span>
    <h1>회원가입을 완료해 주세요</h1>
    <p>{registration.name}님, {registration.provider === 'GOOGLE' ? 'Google' : 'GitHub'} 계정으로 시작합니다.<br />필수 약관을 확인하고 동의해 주세요.</p>
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset disabled={submitting} style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sr-only">회원가입 약관 동의</legend>
        {registration.terms.map(term => <div key={term.id} className={styles.term}>
          <label><input type="checkbox" required={term.required} checked={Boolean(agreements[term.id])}
            onChange={event => setAgreements(current => ({ ...current, [term.id]: event.target.checked }))} />
            [{term.required ? '필수' : '선택'}] {term.title}
          </label>
          <details><summary>내용 보기 · {term.version}</summary><p tabIndex={0}>{term.content}</p></details>
        </div>)}
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={!requiredAgreed || submitting}>{submitting ? '가입 처리 중…' : '동의하고 가입하기'}</button>
        <Link href="/login">돌아가기</Link>
      </div>
    </form>
  </main>
}
