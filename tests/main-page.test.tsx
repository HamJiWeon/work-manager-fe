import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MainPage } from '@/components/main-page'

const TODAY = '2026-09-09'
beforeEach(() => localStorage.clear())

async function openProject(user: ReturnType<typeof userEvent.setup>) {
  const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
  await user.click(within(sidebar).getByRole('button', { name: /PROJECT/ }))
  await user.click(screen.getByRole('button', { name: /프로젝트1.*작업 현황 보기/ }))
}

describe('workspace', () => {
  it('drag_tabs_preview_commit_and_cancel_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    await openProject(user)
    const source = screen.getByRole('tab', { name: '프로젝트1' })
    const target = screen.getByRole('tab', { name: '작업 현황' }).parentElement!
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect)
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    // when
    fireEvent.dragStart(source, { dataTransfer })
    const over = createEvent.dragOver(target, { dataTransfer })
    Object.defineProperty(over, 'clientX', { value: 10 })
    fireEvent(target, over)
    // then
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['프로젝트1', '작업 현황', '프로젝트 리스트'])
    expect(source).toHaveAttribute('aria-selected', 'true')
    // when
    fireEvent.dragEnd(source)
    // then
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['작업 현황', '프로젝트 리스트', '프로젝트1'])
    // when
    fireEvent.dragStart(source, { dataTransfer })
    fireEvent(target, over)
    fireEvent.drop(target, { dataTransfer })
    fireEvent.dragEnd(source)
    // then
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['프로젝트1', '작업 현황', '프로젝트 리스트'])
    expect(screen.getByRole('tabpanel', { name: '프로젝트1' })).toBeVisible()
  })

  it('year_and_project_filter_update_activity_and_reset_date_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    // when
    await user.click(screen.getByRole('button', { name: '2025' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '프로젝트 선택' }), 'project-2')
    // then
    expect(screen.getByRole('heading', { name: /2025년 작업 완료 \d+개/ })).toBeVisible()
    expect(screen.getByRole('heading', { name: '날짜별 작업' })).toBeVisible()
    expect(screen.getByRole('tab', { name: '프로젝트2 작업 현황' })).toHaveAttribute('aria-selected', 'true')
    // when
    await user.click(screen.getAllByRole('button', { name: /2025-.*완료한 작업 [1-9]/ })[0])
    // then
    expect(within(screen.getByRole('list')).getAllByRole('button').every(button => within(button).getByText('프로젝트2 / Login').textContent === '프로젝트2 / Login')).toBe(true)
  })

  it('board_menu_sidebar_home_and_mobile_toggle_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    await openProject(user)
    // when
    await user.click(screen.getByRole('button', { name: 'WORKSPACE' }))
    await user.click(screen.getByRole('button', { name: 'BOARD' }))
    // then
    expect(screen.getByRole('region', { name: '보드' })).toBeVisible()
    // when
    await user.click(within(screen.getByRole('complementary')).getByRole('button', { name: '작업 현황' }))
    await user.click(screen.getByRole('button', { name: '모바일 메뉴 열기' }))
    await user.click(screen.getByRole('button', { name: '모바일 메뉴 접기' }))
    // then
    expect(screen.getByRole('tab', { name: '작업 현황' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: '모바일 메뉴 열기' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('desktop_sidebar_toggle_keeps_page_and_restores_navigation_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    // when
    await user.click(screen.getByRole('button', { name: '사이드바 접기' }))
    // then
    expect(screen.getByRole('button', { name: '사이드바 펼치기' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('tabpanel', { name: '작업 현황' })).toBeVisible()
    // when
    await user.click(screen.getByRole('button', { name: '사이드바 펼치기' }))
    // then
    expect(screen.getByRole('button', { name: '사이드바 접기' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('complementary', { name: '워크스페이스 탐색' })).toBeVisible()
  })

  it('reorder_tabs_with_keyboard_preserves_active_page_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    await openProject(user)
    const tab = screen.getByRole('tab', { name: '프로젝트1' })
    // when
    tab.focus()
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    // then
    expect(screen.getAllByRole('tab').map(item => item.textContent)).toEqual(['작업 현황', '프로젝트1', '프로젝트 리스트'])
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(tab).toHaveFocus()
  })

  it('completed_task_opens_card_detail_and_returns_to_activity_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    await user.click(screen.getAllByRole('button', { name: /완료한 작업 [1-9]\d*개/ })[0])
    const taskButton = within(screen.getByRole('list')).getAllByRole('button')[0]
    const title = taskButton.getAttribute('aria-label')!.replace(' 카드 열기', '')
    // when
    await user.click(taskButton)
    // then
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: title })).toHaveAttribute('aria-selected', 'true')
    // when
    await user.click(screen.getByRole('tab', { name: '작업 현황' }))
    // then
    expect(screen.getByRole('button', { name: `${title} 카드 열기` })).toBeVisible()
  })

  it('workspace_tabs_support_keyboard_navigation_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
    await openProject(user)
    const home = screen.getByRole('tab', { name: '작업 현황' })
    const projects = screen.getByRole('tab', { name: '프로젝트 리스트' })
    const project = screen.getByRole('tab', { name: '프로젝트1' })
    // then
    expect(home).toHaveAttribute('tabindex', '-1')
    expect(project).toHaveAttribute('tabindex', '0')
    // when
    await user.click(project)
    await user.keyboard('{ArrowRight}')
    // then
    expect(home).toHaveFocus()
    expect(home).toHaveAttribute('aria-selected', 'true')
    // when
    await user.keyboard('{ArrowLeft}')
    // then
    expect(project).toHaveFocus()
    // when
    await user.keyboard('{Home}{ArrowRight}')
    // then
    expect(projects).toHaveFocus()
    // when
    await user.keyboard('{End}{Delete}')
    // then
    expect(screen.queryByRole('tab', { name: '프로젝트1' })).not.toBeInTheDocument()
    expect(projects).toHaveFocus()
  })

  it('common_document_save_updates_own_tab_label_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    await user.click(screen.getByRole('tab', { name: '작업 현황' }))
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
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    await user.click(screen.getByRole('tab', { name: '작업 현황' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 활동', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: '작업 현황' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
  })

  it('open_card_from_board_list_and_return_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
    await openProject(user)
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: 'w. Work Manager' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 활동', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '프로젝트 선택' })).toHaveValue('all')
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
  })

  it('close_mobile_menu_on_navigation_and_escape_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    render(<MainPage today={TODAY} />)
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
    const { unmount } = render(<MainPage today="2026-09-30" />)
    // when
    act(() => vi.advanceTimersByTime(2_000))
    // then
    expect(screen.getByRole('heading', { name: /2026년 작업 완료 \d+개/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2026-10-01 오늘/ })).toHaveAttribute('aria-pressed', 'true')
    unmount()
    vi.useRealTimers()
  })

})
