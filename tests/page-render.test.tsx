import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Page from '@/app/page'
import RootLayout from '@/app/layout'
import { WorkspacePage } from '@/components/workspace-page'
import { CardPage } from '@/components/card-page'

vi.mock('@vercel/analytics/next', () => ({ Analytics: () => <span>analytics</span> }))
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe('server_render', () => {
  it('page_uses_seoul_date_and_default_activity_ok', () => {
    // given
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T15:00:00Z'))
    // when
    const html = renderToStaticMarkup(<Page />)
    // then
    expect(html).toContain('2027년 작업 완료')
    expect(html).toContain('2027-01-01 오늘')
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
