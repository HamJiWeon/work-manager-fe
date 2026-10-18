import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomePage from '@/app/page'
import LoginRoute from '@/app/login/page'
import SignupRoute from '@/app/signup/page'
import OAuthCallbackPage from '@/app/oauth/callback/page'
import Page from '@/app/workspace/page'
import RootLayout from '@/app/layout'
import { WorkspacePage } from '@/components/workspace-page'
import { CardPage } from '@/components/card-page'

vi.mock('@vercel/analytics/next', () => ({ Analytics: () => <span>analytics</span> }))
vi.mock('next/navigation', async importOriginal => ({
  ...await importOriginal<typeof import('next/navigation')>(),
  useRouter: () => ({ replace: vi.fn() }),
}))
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe('server_render', () => {
  it('oauth_callback_checks_authentication_before_navigation_ok', () => {
    // when / then
    expect(renderToStaticMarkup(<OAuthCallbackPage />)).toContain('로그인 확인 중')
  })

  it.each([undefined, 'oauth', ''])('login_route_renders_search_error_guidance_ok_%#', async error => {
    // given
    const searchParams = Promise.resolve(error === undefined ? {} : { error })
    // when
    const html = renderToStaticMarkup(await LoginRoute({ searchParams }))
    // then
    expect(html).toContain('/backend/oauth2/authorization/google')
    expect(html.includes('소셜 인증을 완료하지 못했습니다')).toBe(error !== undefined)
  })

  it('signup_route_renders_registration_loading_state_ok', () => {
    // given / when
    const html = renderToStaticMarkup(<SignupRoute />)
    // then
    expect(html).toContain('로그인 확인 중')
    expect(html).not.toContain('동의하고 가입하기')
  })

  it('home_redirects_to_login_ok', () => {
    // when / then
    expect(() => HomePage()).toThrow('NEXT_REDIRECT')
    try {
      HomePage()
    } catch (error) {
      expect(error).toHaveProperty('digest', 'NEXT_REDIRECT;replace;/login;307;')
    }
  })

  it('page_uses_seoul_date_and_default_activity_ok', () => {
    // given
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T15:00:00Z'))
    // when
    const html = renderToStaticMarkup(<Page />)
    // then
    expect(Page().props.today).toBe('2027-01-01')
    expect(html).toContain('로그인 확인 중')
    expect(html).not.toContain('2027년 작업 완료')
  })

  it('layout_wraps_content_with_korean_document_ok', () => {
    // when
    const html = renderToStaticMarkup(<RootLayout><main>작업 화면</main></RootLayout>)
    // then
    expect(html).toContain('lang="ko"')
    expect(html).toContain('<main>작업 화면</main>')
    expect(html).not.toContain('analytics')
  })

  it('workspace_and_card_server_snapshots_render_without_browser_storage_ok', () => {
    // when
    const workspace = renderToStaticMarkup(<WorkspacePage projectId="project-1" document={null} onOpenDocument={() => {}} onBack={() => {}} />)
    const card = renderToStaticMarkup(<CardPage boardId="server-board" />)
    // then
    expect(workspace).toContain('0720 회의록.md')
    expect(workspace).toContain('커밋 컨벤션.md')
    expect(card).toContain('시작 전')
    expect(card).toContain('카드를 불러오는 중')
  })
})
