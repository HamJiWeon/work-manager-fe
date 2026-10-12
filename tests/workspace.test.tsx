import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Workspace } from '@/components/workspace'

const TODAY = '2026-09-09'
beforeEach(() => localStorage.clear())

async function openProject(user: ReturnType<typeof userEvent.setup>) {
  const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
  await user.click(within(sidebar).getByRole('button', { name: /PROJECT/ }))
  await user.click(screen.getByRole('button', { name: /프로젝트1.*작업 현황 보기/ }))
}

describe('workspace', () => {
  it('common_document_save_updates_own_tab_label_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await openProject(user)
    await user.click(screen.getByRole('button', { name: 'WORKSPACE' }))
    await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    // when
    await user.clear(screen.getByRole('textbox', { name: '문서 제목' }))
    await user.type(screen.getByRole('textbox', { name: '문서 제목' }), '회의 정리')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('tab', { name: '회의 정리.md' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: '회의 정리.md' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회의 정리.md 탭 닫기' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('tab', { name: '프로젝트1 Workspace' }))
    await user.click(within(screen.getByRole('tabpanel', { name: '프로젝트1 Workspace' })).getByRole('button', { name: /회의 정리.md/ }))
    // then
    expect(screen.getAllByRole('tab', { name: '회의 정리.md' })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: '회의 정리' })).toBeInTheDocument()
  })

  it.each(['card', 'common'])('document_tabs_preserve_unsaved_drafts_ok_%s', async (kind) => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await openProject(user)
    if (kind === 'card') {
      await user.click(screen.getByRole('button', { name: /User 사용자 정보/ }))
      await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
      await user.click(screen.getByRole('button', { name: '편집' }))
    } else {
      await user.click(screen.getByRole('button', { name: 'WORKSPACE' }))
      await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    }
    const titleLabel = kind === 'card' ? '카드 제목' : '문서 제목'
    const tabLabel = kind === 'card' ? 'Team' : '0720 회의록.md'
    // when
    await user.clear(screen.getByRole('textbox', { name: titleLabel }))
    await user.type(screen.getByRole('textbox', { name: titleLabel }), '미저장 제목')
    await user.clear(screen.getByRole('textbox', { name: 'Markdown 작성' }))
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '미저장 본문')
    await user.click(screen.getByRole('tab', { name: '워크스페이스' }))
    // then
    expect(screen.queryByRole('textbox', { name: 'Markdown 작성' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('tab', { name: tabLabel }))
    // then
    expect(screen.getByRole('textbox', { name: titleLabel })).toHaveValue('미저장 제목')
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('미저장 본문')
    // when
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('heading', { name: '미저장 제목' })).toBeInTheDocument()
  })

  it('board_tabs_preserve_independent_layouts_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await user.click(screen.getByRole('button', { name: '프로젝트1 User 보드' }))
    // when
    await user.click(screen.getByRole('button', { name: '가로 배치' }))
    await user.click(screen.getByRole('button', { name: '프로젝트2 Team 보드' }))
    // then
    expect(screen.getByRole('button', { name: '세로 배치' })).toHaveAttribute('aria-pressed', 'true')
    // when
    await user.click(screen.getByRole('tab', { name: 'User' }))
    // then
    expect(screen.getByRole('button', { name: '가로 배치' })).toHaveAttribute('aria-pressed', 'true')
    // when
    await user.click(screen.getByRole('tab', { name: 'Team' }))
    // then
    expect(screen.getByRole('button', { name: '세로 배치' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switch_and_close_screen_tabs_without_back_buttons_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await openProject(user)
    await user.click(screen.getByRole('button', { name: /User.*사용자 정보/ }))
    // then
    expect(screen.getByRole('tab', { name: 'User' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('프로젝트 리스트로 돌아가기')).not.toBeInTheDocument()
    expect(screen.queryByText('보드 목록으로 돌아가기')).not.toBeInTheDocument()
    expect(screen.queryByText('BOARD / CARDS')).not.toBeInTheDocument()
    expect(screen.queryByText('상태별 카드를 확인하세요.')).not.toBeInTheDocument()
    expect(screen.queryByText('드래그하여 카드의 상태와 순서를 바꿔보세요.')).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('tab', { name: '프로젝트1' }))
    await user.click(screen.getByRole('tab', { name: 'User' }))
    // then
    expect(await screen.findByRole('button', { name: 'Team 카드 열기' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: 'User 탭 닫기' }))
    // then
    expect(screen.queryByRole('tab', { name: 'User' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '프로젝트1' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /User.*사용자 정보/ })).toBeInTheDocument()
  })

  it('open_project_common_and_return_home_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
    expect(within(sidebar).getByText('SPACE')).toBeInTheDocument()
    // when
    await user.click(within(sidebar).getByRole('button', { name: /PROJECT/ }))
    // then
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: /프로젝트1.*작업 현황 보기/ }))
    // then
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: '프로젝트1 User 보드' })).toBeInTheDocument()
    expect(within(sidebar).queryByText('보드1')).not.toBeInTheDocument()
    // when
    const navigation = screen.getByRole('navigation', { name: '프로젝트 메뉴 선택' })
    await user.click(within(navigation).getByRole('button', { name: 'WORKSPACE' }))
    // then
    expect(screen.getByRole('button', { name: /0720 회의록.md/ })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: '프로젝트1 User 보드' })).not.toHaveClass('active')
    // when
    await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    // then
    expect(screen.getByRole('heading', { name: '프로젝트1', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '문서 제목' })).toHaveValue('0720 회의록')
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: '0720 회의록.md' })).toBeInTheDocument()
    const documentTab = screen.getByRole('tab', { name: '0720 회의록.md' })
    expect(documentTab.id).not.toMatch(/\s/)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', documentTab.id)
    // when
    await user.click(screen.getByRole('tab', { name: '워크스페이스' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 현황', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: '워크스페이스' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
  })

  it('open_card_from_board_list_and_return_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await openProject(user)
    expect(screen.queryByRole('button', { name: '세로 배치' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: /User 사용자 정보/ }))
    // then
    expect(await screen.findByRole('region', { name: '시작 전 카드 목록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '세로 배치' })).toHaveAttribute('aria-pressed', 'true')
    // when
    await user.click(screen.getByRole('tab', { name: '프로젝트1' }))
    // then
    expect(screen.getByRole('button', { name: /User 사용자 정보/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '시작 전 카드 목록' })).not.toBeInTheDocument()
  })

  it('toggle_project_folder_by_name_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
    // when
    await user.click(within(sidebar).getByText('프로젝트1', { exact: true }))
    // then
    expect(within(sidebar).getByRole('button', { name: '프로젝트1 User 보드', hidden: true })).not.toBeVisible()
    // when
    await user.click(within(sidebar).getByText('프로젝트1', { exact: true }))
    // then
    expect(within(sidebar).getByRole('button', { name: '프로젝트1 User 보드' })).toBeVisible()
  })
  it('return_home_from_board_with_brand_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await openProject(user)
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: 'w. Work Manager' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 현황', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '프로젝트 선택' })).toHaveValue('all')
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
  })

  it('close_mobile_menu_on_navigation_and_escape_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    // when
    await user.click(screen.getByRole('button', { name: '모바일 메뉴 열기' }))
    await user.click(screen.getByRole('button', { name: '프로젝트1 User 보드' }))
    // then
    expect(screen.getByRole('button', { name: '모바일 메뉴 열기' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('heading', { name: 'User', level: 2 })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '모바일 메뉴 열기' }))
    await user.keyboard('{Escape}')
    // then
    expect(screen.getByRole('button', { name: '모바일 메뉴 열기' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: '모바일 메뉴 닫기' })).not.toBeInTheDocument()
  })

  it('trap_focus_inside_open_mobile_menu_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const mobileMenuButton = screen.getByRole('button', { name: '모바일 메뉴 열기' })
    // when
    await user.click(mobileMenuButton)
    // then
    expect(screen.getByRole('button', { name: 'w. Work Manager' })).toHaveFocus()
    // when
    await user.tab({ shift: true })
    // then
    expect(screen.getByRole('button', { name: '프로젝트2 Team 보드' })).toHaveFocus()
    // when
    await user.tab()
    // then
    expect(screen.getByRole('button', { name: 'w. Work Manager' })).toHaveFocus()
  })

  it('trap_focus_with_collapsed_last_project_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const mobileMenuButton = screen.getByRole('button', { name: '모바일 메뉴 열기' })
    await user.click(mobileMenuButton)
    const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
    const lastSummary = within(sidebar).getByText('프로젝트2', { exact: true }).closest('summary')!
    // when
    await user.click(lastSummary)
    await user.tab()
    // then
    expect(screen.getByRole('button', { name: 'w. Work Manager' })).toHaveFocus()
    // when
    await user.tab({ shift: true })
    // then
    expect(lastSummary).toHaveFocus()
    // when
    await user.keyboard('{Escape}')
    // then
    expect(mobileMenuButton).toHaveFocus()
  })


  it('card_tabs_keep_board_layout_and_hide_back_button_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await user.click(screen.getByRole('button', { name: '프로젝트2 User 보드' }))
    expect(screen.getByRole('heading', { name: '프로젝트2', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '세로 배치' })).toHaveAttribute('aria-pressed', 'true')
    // when
    await user.click(screen.getByRole('button', { name: '가로 배치' }))
    await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
    // then
    expect(screen.getByRole('tab', { name: 'Team' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('button', { name: /돌아가기/ })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Team Markdown 문서' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('tab', { name: 'User' }))
    // then
    expect(screen.getByRole('button', { name: '가로 배치' })).toHaveAttribute('aria-pressed', 'true')
    // when
    await user.click(screen.getByRole('button', { name: '필터' }))
    // then
    expect(screen.getByRole('searchbox', { name: '담당 멤버 검색' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '필터' }))
    // then
    expect(screen.queryByRole('searchbox', { name: '담당 멤버 검색' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '필터' }))
    await user.click(screen.getByRole('tab', { name: '기간' }))
    expect(screen.queryByRole('combobox', { name: '기간 기준' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('기간 시작')).toBeInTheDocument()
    expect(screen.getByLabelText('기간 종료')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '코드' }))
    await user.type(screen.getByRole('searchbox', { name: '코드' }), 'PJT-12abc')
    expect(screen.getByRole('searchbox', { name: '코드' })).toHaveValue('12')
    expect(screen.getByText('PJT-', { exact: true })).toBeInTheDocument()
    // when
    await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
    // then
    expect(screen.getAllByRole('tab', { name: 'Team' })).toHaveLength(1)
  })

  it('refresh_today_at_seoul_midnight_ok', () => {
    // given
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T14:59:59.000Z'))
    const { unmount } = render(<Workspace today="2026-09-30" />)
    // when
    act(() => vi.advanceTimersByTime(2_000))
    // then
    expect(screen.getByRole('heading', { name: '2026년 10월' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2026-10-01 오늘/ })).toHaveAttribute('aria-pressed', 'true')
    unmount()
    vi.useRealTimers()
  })

})
