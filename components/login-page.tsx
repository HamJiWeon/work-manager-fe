import Link from 'next/link'
import { Layers } from 'lucide-react'
import styles from './login-page.module.css'
import { LoginFeatures } from './login-features'

interface LoginPageProps {
  backendUrl: string
  loginError?: boolean
}

/** 백엔드의 Google·GitHub OAuth 진입점으로 브라우저를 이동시킨다. */
export function LoginPage({ backendUrl, loginError = false }: LoginPageProps) {
  const authorizationUrl = `${backendUrl.replace(/\/$/, '')}/oauth2/authorization`

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Work Manager 홈">
          <span className={styles.brandMark}><Layers size={21} aria-hidden="true" /></span>
          Work Manager
        </Link>
      </header>

      <main className={styles.content}>
        <div className={styles.main}>
        <section className={styles.intro} aria-labelledby="login-heading">
          <span className={styles.eyebrow}><span /> YOUR WORK, IN ONE PLACE</span>
          <h1 id="login-heading">흩어진 작업을<br />한곳에<br /></h1>
          <p className={styles.description}>프로젝트부터 오늘의 작은 할 일까지<br />Work Manager와 함께 정리하고, 집중하고,<br className={styles.mobileBreak} /> 하나씩 완성해 보세요</p>
        </section>

        <section className={styles.login} aria-labelledby="form-heading">
          <span className={styles.formEyebrow}>GET STARTED</span>
          <h2 id="form-heading">Work Manager 시작하기</h2>
          <p className={styles.formDescription}>소셜 계정으로 가입하거나 로그인하세요</p>
          {loginError && <p role="alert" className={styles.socialNote}>소셜 인증을 완료하지 못했습니다. 다시 시도해 주세요.</p>}
          <div className={styles.socialLogins}>
            <a href={`${authorizationUrl}/google`} className={styles.googleLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.51l3.34-2.59Z" />
                <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
              </svg>
              Google로 계속하기
            </a>
            <a href={`${authorizationUrl}/github`} className={styles.githubLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.62 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
              </svg>
              GitHub로 계속하기
            </a>
          </div>
          <p className={styles.socialNote}>처음 방문하셨다면 소셜 인증 후 가입 절차를 진행해 주세요.</p>
        </section>
        </div>
        <LoginFeatures />
      </main>

      <footer className={styles.footer}><span>© {new Date().getFullYear()} Work Manager</span><span>작은 완료가 만드는 큰 변화</span></footer>
    </div>
  )
}
