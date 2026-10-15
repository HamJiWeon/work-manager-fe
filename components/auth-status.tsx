import Link from 'next/link'
import styles from './auth-panel.module.css'

/** 인증 중에는 보호된 화면을 숨기고 오류 시 재시도와 로그인 경로를 제공한다. */
export function AuthStatus({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return <main className={styles.panel}>
    <h1>{error ? '인증을 확인할 수 없어요' : '로그인 확인 중'}</h1>
    <p role={error ? 'alert' : 'status'}>{error || '잠시만 기다려 주세요.'}</p>
    {error && <div className={styles.actions}>
      {onRetry && <button type="button" className={styles.button} onClick={onRetry}>다시 시도</button>}
      <Link href="/login">로그인으로 돌아가기</Link>
    </div>}
  </main>
}
