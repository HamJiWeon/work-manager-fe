import { act, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CardPage } from '@/components/card-page'
import type { CardItem, CardPageLoader } from '@/lib/card'

afterEach(() => vi.unstubAllGlobals())

async function selectCardForMove(user: ReturnType<typeof userEvent.setup>, card: HTMLElement) {
  card.focus()
  await user.keyboard('[Space]')
}

describe('card_page', () => {
  it('card_metadata_remains_when_status_changes_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    const card = await screen.findByRole('button', { name: 'Team 카드 열기' })
    // then
    expect(within(card).getByLabelText('카드 코드')).toHaveTextContent(/^PJT-1$/)
    expect(within(screen.getByRole('button', { name: 'Team 작업 2 카드 열기' })).getByLabelText('카드 코드')).toHaveTextContent(/^PJT-2$/)
    expect(within(card).getByLabelText('작업 기간')).toHaveTextContent('시작일 미지정~종료일 미지정')
    expect(within(card).queryByLabelText('카드 번호')).not.toBeInTheDocument()
    expect(within(card.closest('article')!).queryByText('이동')).not.toBeInTheDocument()
    expect(within(card.closest('article')!).getAllByRole('button')).toHaveLength(1)
    expect(within(card).getByRole('img', { name: '김민수 프로필 사진' })).toBeInTheDocument()
    expect(within(card).queryByText('팀 생성 및 멤버 관리')).not.toBeInTheDocument()
    expect(within(card).queryByText('시작 전')).not.toBeInTheDocument()
    expect(screen.queryByText('상위 항목')).not.toBeInTheDocument()
    // when
    await selectCardForMove(user, screen.getByRole('button', { name: 'Team 카드 열기' }))
    await user.click(screen.getByLabelText('진행 중 위치 지정'))
    await user.click(screen.getByRole('button', { name: '진행 중으로 이동' }))
    // then
    const moved = within(screen.getByRole('region', { name: '진행 중 카드 목록' })).getByRole('button', { name: 'Team 카드 열기' })
    expect(within(moved).queryByLabelText('카드 번호')).not.toBeInTheDocument()
    expect(within(moved).getByLabelText('카드 코드')).toHaveTextContent(/^PJT-1$/)
    expect(within(moved).getByRole('img', { name: '김민수 프로필 사진' })).toBeInTheDocument()
  })

  it('default_vertical_and_switch_horizontal_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    // then
    expect(screen.getByRole('button', { name: '세로 배치' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('menu', { name: '상태 배치 선택' }).closest('details')).not.toHaveAttribute('open')
    expect(screen.queryByRole('button', { name: '가로 배치' })).not.toBeInTheDocument()
    for (const label of ['시작 전', '진행 중', '완료']) {
      expect(screen.getByRole('region', { name: `${label} 카드 목록` })).toHaveAttribute('tabindex', '0')
    }
    // when
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    expect(screen.getByRole('menuitemradio', { name: '세로 배치' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: '가로 배치' }))
    // then
    expect(screen.getByRole('button', { name: '가로 배치' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('menu', { name: '상태 배치 선택' }).closest('details')).not.toHaveAttribute('open')
    await user.click(screen.getByRole('button', { name: '가로 배치' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('menu', { name: '상태 배치 선택' }).closest('details')).not.toHaveAttribute('open')
    expect(screen.getByRole('button', { name: '가로 배치' })).toHaveFocus()
  })

  it('layout_menu_keyboard_selection_and_escape_restore_focus_ok', async () => {
    // given
    const user = userEvent.setup()
    const onLayoutChange = vi.fn()
    const view = render(<CardPage boardId="layout-board" layout="horizontal" onLayoutChange={onLayoutChange} />)
    const trigger = screen.getByRole('button', { name: '가로 배치' })
    // when
    await user.click(trigger)
    expect(screen.getByRole('menuitemradio', { name: '가로 배치' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    // then
    expect(screen.getByRole('menuitemradio', { name: '세로 배치' })).toHaveFocus()
    expect(trigger.closest('details')).toHaveAttribute('open')
    // when
    await user.keyboard('{Enter}')
    // then
    expect(onLayoutChange).toHaveBeenCalledWith('vertical')
    expect(trigger.closest('details')).not.toHaveAttribute('open')
    expect(trigger).toHaveFocus()
    // when
    view.rerender(<CardPage boardId="layout-board" layout="vertical" onLayoutChange={onLayoutChange} />)
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.keyboard('{Escape}')
    // then
    expect(screen.getByRole('button', { name: '세로 배치' })).toHaveFocus()
    expect(screen.getByRole('menu', { name: '상태 배치 선택' }).closest('details')).not.toHaveAttribute('open')
  })

  it('layout_menu_roving_focus_home_end_and_tab_close_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="keyboard-layout" />)
    const trigger = screen.getByRole('button', { name: '세로 배치' })
    // when
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    // then
    const vertical = screen.getByRole('menuitemradio', { name: '세로 배치' })
    const horizontal = screen.getByRole('menuitemradio', { name: '가로 배치' })
    expect(vertical).toHaveFocus()
    expect(vertical).toHaveAttribute('tabindex', '0')
    expect(horizontal).toHaveAttribute('tabindex', '-1')
    // when / then
    await user.keyboard('{ArrowUp}')
    expect(horizontal).toHaveFocus()
    expect(vertical).toHaveAttribute('tabindex', '-1')
    await user.keyboard('{Home}')
    expect(vertical).toHaveFocus()
    await user.keyboard('{End}')
    expect(horizontal).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(vertical).toHaveFocus()
    await user.keyboard('{Tab}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(vertical).toHaveAttribute('tabindex', '-1')
    expect(horizontal).toHaveAttribute('tabindex', '-1')
  })

  it.each([
    { startDate: '2026-10-14', endDate: '2026-10-15', startLabel: '26-10-14', endLabel: '26-10-15' },
    { startDate: '2026-10-14', startLabel: '26-10-14', endLabel: '종료일 미지정' },
    { endDate: '2026-10-15', startLabel: '시작일 미지정', endLabel: '26-10-15' },
    { startLabel: '시작일 미지정', endLabel: '종료일 미지정' },
  ])('card_and_move_preview_display_dates_ok_%#', async ({ startDate, endDate, startLabel, endLabel }) => {
    // given
    const card: CardItem = { id: 'dated-card', boardId: 'dates-board', cardNumber: 1, projectCode: 'PJT', title: '기간 카드', content: '', memberName: '나', status: 'NOT_STARTED', startDate, endDate }
    const loadPage: CardPageLoader = async (_boardId, status) => ({ items: status === 'NOT_STARTED' ? [card] : [], nextCursor: null })
    render(<CardPage boardId="dates-board" loadPage={loadPage} />)
    const source = await screen.findByRole('button', { name: '기간 카드 카드 열기' })
    // then
    expect(within(source).getByLabelText('작업 기간')).toHaveTextContent(`${startLabel}~${endLabel}`)
    // when
    fireEvent.dragStart(source.closest('article')!, { dataTransfer: { setData: vi.fn() } })
    fireEvent.dragOver(screen.getByRole('region', { name: '진행 중 카드 목록' }), { dataTransfer: {} })
    // then
    const preview = screen.getByRole('article', { name: '기간 카드 이동 미리보기' })
    expect(within(preview).getByLabelText('작업 기간')).toHaveTextContent(`${startLabel}~${endLabel}`)
    // when
    fireEvent.dragEnd(source.closest('article')!)
    // then
    expect(screen.queryByRole('article', { name: '기간 카드 이동 미리보기' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기간 카드 카드 열기' })).toBeInTheDocument()
  })

  it('scroll_loads_only_its_status_and_stops_at_end_ok', async () => {
    // given
    const observers: { callback: IntersectionObserverCallback; target?: Element; disconnected: boolean }[] = []
    vi.stubGlobal('IntersectionObserver', class {
      entry: typeof observers[number]
      constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback, disconnected: false }
        observers.push(this.entry)
      }
      observe(target: Element) { this.entry.target = target }
      disconnect() { this.entry.disconnected = true }
    })
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const progress = screen.getByRole('region', { name: '진행 중 카드 목록' })
    await within(todo).findByRole('heading', { name: 'Team' })
    await waitFor(() => expect(observers.length).toBe(3))
    // when
    await userEvent.setup().click(screen.getByRole('button', { name: '세로 배치' }))
    await userEvent.setup().click(screen.getByRole('menuitemradio', { name: '가로 배치' }))
    const trigger = () => {
      const observer = observers.findLast(entry => !entry.disconnected && entry.target && todo.contains(entry.target))!
      observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    }
    act(trigger)
    // then
    await within(todo).findByRole('heading', { name: 'Team 작업 16' })
    expect(within(progress).getAllByRole('listitem')).toHaveLength(8)
    // when
    await waitFor(() => expect(observers.filter(entry => !entry.disconnected && entry.target && todo.contains(entry.target))).toHaveLength(1))
    act(trigger)
    // then
    await within(todo).findByText('모든 카드를 불러왔습니다.')
    expect(within(todo).getAllByRole('listitem')).toHaveLength(24)
    expect(within(todo).queryByRole('button', { name: '시작 전 더 불러오기' })).not.toBeInTheDocument()
  })

  it('click_move_changes_status_and_keeps_card_unique_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const progress = screen.getByRole('region', { name: '진행 중 카드 목록' })
    await selectCardForMove(user, await within(todo).findByRole('button', { name: 'Team 카드 열기' }))
    // when
    await user.click(screen.getByLabelText('진행 중 위치 지정'))
    await user.click(screen.getByRole('button', { name: '진행 중으로 이동' }))
    // then
    expect(within(todo).queryByRole('button', { name: 'Team 카드 열기' })).not.toBeInTheDocument()
    const moved = within(progress).getByRole('button', { name: 'Team 카드 열기' })
    expect(within(moved).queryByText('진행 중')).not.toBeInTheDocument()
    // when
    await selectCardForMove(user, moved)
    await user.click(screen.getByLabelText('완료 위치 지정'))
    await user.click(screen.getByRole('button', { name: '완료로 이동' }))
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.click(screen.getByRole('menuitemradio', { name: '가로 배치' }))
    await user.click(within(todo).getByRole('button', { name: '시작 전 더 불러오기' }))
    // then
    await within(todo).findByRole('heading', { name: 'Team 작업 16' })
    expect(screen.getAllByRole('button', { name: 'Team 카드 열기' })).toHaveLength(1)
    const done = screen.getByRole('region', { name: '완료 카드 목록' })
    expect(within(within(done).getByRole('button', { name: 'Team 카드 열기' })).queryByText('완료')).not.toBeInTheDocument()
  })

  it('drag_card_to_other_status_ok', async () => {
    // given
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const done = screen.getByRole('region', { name: '완료 카드 목록' })
    const card = (await within(todo).findByRole('button', { name: 'Team 카드 열기' })).closest('article')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    // when
    fireEvent.dragStart(card, { dataTransfer })
    fireEvent.dragOver(done, { dataTransfer })
    fireEvent.drop(done, { dataTransfer })
    fireEvent.dragEnd(card, { dataTransfer })
    // then
    expect(within(todo).queryByRole('button', { name: 'Team 카드 열기' })).not.toBeInTheDocument()
    expect(within(within(done).getByRole('button', { name: 'Team 카드 열기' })).queryByText('완료')).not.toBeInTheDocument()
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'project1-NOT_STARTED-0')
  })

  it('place_card_before_and_after_and_keep_order_after_pagination_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    await selectCardForMove(user, await within(todo).findByRole('button', { name: 'Team 카드 열기' }))
    // when
    expect(screen.getByLabelText('시작 전 위치 지정').closest('details')).not.toHaveAttribute('open')
    await user.click(screen.getByLabelText('시작 전 위치 지정'))
    await user.selectOptions(screen.getByRole('combobox', { name: '시작 전 기준 카드' }), 'project1-NOT_STARTED-2')
    await user.selectOptions(screen.getByRole('combobox', { name: '시작 전 이동 위치' }), 'after')
    await user.click(within(screen.getByRole('heading', { name: '시작 전' }).closest('section')!).getByRole('button', { name: '이 위치로 이동' }))
    // then
    expect(within(todo).getAllByRole('heading').slice(0, 3).map(element => element.textContent)).toEqual(['Team 작업 2', 'Team 작업 3', 'Team'])
    // when
    await selectCardForMove(user, within(todo).getByRole('button', { name: 'Team 카드 열기' }))
    await user.click(screen.getByLabelText('진행 중 위치 지정'))
    await user.selectOptions(screen.getByRole('combobox', { name: '진행 중 기준 카드' }), 'project1-IN_PROGRESS-0')
    await user.click(within(screen.getByRole('heading', { name: '진행 중' }).closest('section')!).getByRole('button', { name: '이 위치로 이동' }))
    const progress = screen.getByRole('region', { name: '진행 중 카드 목록' })
    await user.click(within(progress).getByRole('button', { name: '진행 중 더 불러오기' }))
    await within(progress).findByRole('heading', { name: 'User 작업 16' })
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.click(screen.getByRole('menuitemradio', { name: '가로 배치' }))
    // then
    expect(within(progress).getAllByRole('heading').slice(0, 2).map(element => element.textContent)).toEqual(['Team', 'User'])
    expect(within(todo).queryByRole('heading', { name: 'Team' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Team' })).toHaveLength(1)
  })

  it.each(['세로 배치', '가로 배치'])('drag_to_exact_position_%s_ok', async layout => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.click(screen.getByRole('menuitemradio', { name: layout }))
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const source = (await within(todo).findByRole('button', { name: 'Team 카드 열기' })).closest('article')!
    const target = within(todo).getByRole('button', { name: 'Team 작업 3 카드 열기' }).closest('li')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    // when
    fireEvent.dragStart(source, { dataTransfer })
    const drop = createEvent.drop(target, { dataTransfer })
    Object.defineProperties(drop, { clientX: { value: 90 }, clientY: { value: 90 } })
    fireEvent(target, drop)
    // then
    expect(within(todo).getAllByRole('heading').slice(0, 3).map(element => element.textContent)).toEqual(['Team 작업 2', 'Team 작업 3', 'Team'])
    // when
    fireEvent.dragStart(within(todo).getByRole('button', { name: 'Team 카드 열기' }).closest('article')!, { dataTransfer })
    const before = within(todo).getByRole('button', { name: 'Team 작업 2 카드 열기' }).closest('li')!
    vi.spyOn(before, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    const beforeDrop = createEvent.drop(before, { dataTransfer })
    Object.defineProperties(beforeDrop, { clientX: { value: 0 }, clientY: { value: 0 } })
    fireEvent(before, beforeDrop)
    // then
    expect(within(todo).getAllByRole('heading')[0].textContent).toBe('Team')
    expect(within(todo).getAllByRole('listitem')).toHaveLength(8)
  })

  it.each(['세로 배치', '가로 배치'])('preview_hides_source_and_cancel_restores_%s_ok', async layout => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.click(screen.getByRole('menuitemradio', { name: layout }))
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const progress = screen.getByRole('region', { name: '진행 중 카드 목록' })
    const source = (await within(todo).findByRole('button', { name: 'Team 카드 열기' })).closest('article')!
    const target = within(progress).getByRole('button', { name: 'User 카드 열기' }).closest('li')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    // when
    fireEvent.dragStart(source, { dataTransfer })
    const over = createEvent.dragOver(target, { dataTransfer })
    Object.defineProperties(over, { clientX: { value: 10 }, clientY: { value: 10 } })
    fireEvent(target, over)
    // then
    expect(within(todo).queryByRole('button', { name: 'Team 카드 열기' })).not.toBeInTheDocument()
    const preview = within(progress).getByRole('article', { name: 'Team 이동 미리보기' })
    expect(preview).toHaveClass('card-drop-preview')
    expect(within(preview).queryByText('진행 중')).not.toBeInTheDocument()
    expect(within(progress).getAllByRole('heading').slice(0, 2).map(element => element.textContent)).toEqual(['Team', 'User'])
    // when
    fireEvent.dragEnd(source)
    // then
    expect(within(todo).getByRole('button', { name: 'Team 카드 열기' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Team 이동 미리보기' })).not.toBeInTheDocument()
    expect(within(todo).getAllByRole('heading')[0].textContent).toBe('Team')
  })

  it('drag_leave_clears_preview_and_selection_can_be_cleared_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const done = screen.getByRole('region', { name: '완료 카드 목록' })
    const card = await within(todo).findByRole('button', { name: 'Team 카드 열기' })
    const source = card.closest('article')!
    const target = done.closest('section')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    // when
    card.focus()
    await user.keyboard('[Space]')
    await user.click(screen.getByRole('button', { name: '선택 해제' }))
    // then
    expect(screen.queryByRole('button', { name: '선택 해제' })).not.toBeInTheDocument()
    // when
    fireEvent.dragStart(source, { dataTransfer })
    fireEvent.dragOver(target, { dataTransfer })
    // then
    expect(within(done).getByRole('article', { name: 'Team 이동 미리보기' })).toBeInTheDocument()
    // when
    fireEvent.dragLeave(target, { relatedTarget: document.body })
    // then
    expect(screen.queryByRole('article', { name: 'Team 이동 미리보기' })).not.toBeInTheDocument()
    fireEvent.dragEnd(source, { dataTransfer })
  })

  it('drop_on_preview_commits_exact_position_ok', async () => {
    // given
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const done = screen.getByRole('region', { name: '완료 카드 목록' })
    const source = (await within(todo).findByRole('button', { name: 'Team 카드 열기' })).closest('article')!
    const target = within(done).getByRole('button', { name: 'Login 카드 열기' }).closest('li')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    // when
    fireEvent.dragStart(source, { dataTransfer })
    const over = createEvent.dragOver(target, { dataTransfer })
    Object.defineProperties(over, { clientX: { value: 90 }, clientY: { value: 90 } })
    fireEvent(target, over)
    const preview = within(done).getByRole('article', { name: 'Team 이동 미리보기' })
    fireEvent.dragOver(preview.closest('li')!, { dataTransfer })
    fireEvent.drop(preview.closest('li')!, { dataTransfer })
    // then
    expect(within(done).getAllByRole('heading').slice(0, 3).map(element => element.textContent)).toEqual(['Login', 'Team', 'Login 작업 2'])
    expect(within(todo).queryByRole('button', { name: 'Team 카드 열기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Team 이동 미리보기' })).not.toBeInTheDocument()
    expect(within(within(done).getByRole('button', { name: 'Team 카드 열기' })).queryByText('완료')).not.toBeInTheDocument()
  })

  it.each(['세로 배치', '가로 배치'])('move_to_first_through_leading_gap_%s_ok', async layout => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.click(screen.getByRole('menuitemradio', { name: layout }))
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const progress = screen.getByRole('region', { name: '진행 중 카드 목록' })
    const source = (await within(todo).findByRole('button', { name: 'Team 카드 열기' })).closest('article')!
    const first = within(progress).getByRole('button', { name: 'User 카드 열기' }).closest('li')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200, x: 100, y: 100, toJSON: () => ({}) })
    const hover = (target: HTMLElement, coordinate: number) => {
      const event = createEvent.dragOver(target, { dataTransfer })
      Object.defineProperties(event, { clientX: { value: coordinate }, clientY: { value: coordinate } })
      fireEvent(target, event)
    }
    // when
    fireEvent.dragStart(source, { dataTransfer })
    hover(first, 190)
    hover(first, 110)
    hover(progress, 90)
    // then
    expect(within(progress).getAllByRole('heading')[0].textContent).toBe('Team')
    // when
    fireEvent.drop(progress, { dataTransfer })
    // then
    expect(within(progress).getAllByRole('heading').slice(0, 2).map(element => element.textContent)).toEqual(['Team', 'User'])
    expect(within(todo).queryByRole('button', { name: 'Team 카드 열기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Team 이동 미리보기' })).not.toBeInTheDocument()
  })

  it('reorder_same_status_to_first_from_leading_gap_ok', async () => {
    // given
    render(<CardPage boardId="project1" />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const source = (await within(todo).findByRole('button', { name: 'Team 작업 3 카드 열기' })).closest('article')!
    const first = within(todo).getByRole('button', { name: 'Team 카드 열기' }).closest('li')!
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200, x: 100, y: 100, toJSON: () => ({}) })
    // when
    fireEvent.dragStart(source, { dataTransfer })
    const over = createEvent.dragOver(todo, { dataTransfer })
    Object.defineProperties(over, { clientX: { value: 90 }, clientY: { value: 90 } })
    fireEvent(todo, over)
    fireEvent.drop(todo, { dataTransfer })
    // then
    expect(within(todo).getAllByRole('heading').slice(0, 3).map(element => element.textContent)).toEqual(['Team 작업 3', 'Team', 'Team 작업 2'])
    expect(within(todo).getAllByRole('listitem')).toHaveLength(8)
  })

  it.each(['세로 배치', '가로 배치'])('reorder_only_after_crossing_thirty_five_percent_%s_ok', async layout => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="project1" />)
    await user.click(screen.getByRole('button', { name: '세로 배치' }))
    await user.click(screen.getByRole('menuitemradio', { name: layout }))
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const source = (await within(todo).findByRole('button', { name: 'Team 카드 열기' })).closest('article')!
    const target = within(todo).getByRole('button', { name: 'Team 작업 2 카드 열기' }).closest('li')!
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200, x: 100, y: 100, toJSON: () => ({}) })
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    const hover = (coordinate: number) => {
      const event = createEvent.dragOver(target, { dataTransfer })
      Object.defineProperties(event, { clientX: { value: coordinate }, clientY: { value: coordinate } })
      fireEvent(target, event)
    }
    // when
    fireEvent.dragStart(source, { dataTransfer })
    hover(134)
    // then
    expect(screen.queryByRole('article', { name: 'Team 이동 미리보기' })).not.toBeInTheDocument()
    // when
    hover(135)
    // then
    expect(screen.queryByRole('article', { name: 'Team 이동 미리보기' })).not.toBeInTheDocument()
    // when
    hover(136)
    // then
    expect(within(todo).getByRole('article', { name: 'Team 이동 미리보기' })).toBeInTheDocument()
    // when
    fireEvent.drop(target, { dataTransfer })
    // then
    expect(within(todo).getAllByRole('heading').slice(0, 2).map(element => element.textContent)).toEqual(['Team 작업 2', 'Team'])
  })

  it('loading_empty_error_and_retry_ok', async () => {
    // given
    const user = userEvent.setup()
    let resolvePage!: (page: { items: []; nextCursor: null }) => void
    const loadPage = vi.fn<CardPageLoader>()
      .mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve }))
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValue({ items: [], nextCursor: null })
    render(<CardPage boardId="project1" loadPage={loadPage} />)
    const todo = screen.getByRole('region', { name: '시작 전 카드 목록' })
    const progress = screen.getByRole('region', { name: '진행 중 카드 목록' })
    // then
    expect(within(todo).getByRole('status')).toBeInTheDocument()
    expect(await within(progress).findByRole('alert')).toHaveTextContent('카드를 불러오지 못했습니다.')
    // when
    await user.click(within(progress).getByRole('button', { name: '진행 중 다시 시도' }))
    act(() => resolvePage({ items: [], nextCursor: null }))
    // then
    expect(await within(progress).findByText('아직 진행 중 카드가 없습니다.')).toBeInTheDocument()
    expect(await within(todo).findByText('아직 시작 전 카드가 없습니다.')).toBeInTheDocument()
  })

  it('board_change_discards_old_request_ok', async () => {
    // given
    let resolveOld!: (page: { items: []; nextCursor: null }) => void
    const loadPage = vi.fn<CardPageLoader>().mockImplementation((boardId) => boardId === 'old'
      ? new Promise(resolve => { resolveOld = resolve })
      : Promise.resolve({ items: [], nextCursor: null }))
    const { rerender } = render(<CardPage boardId="old" loadPage={loadPage} />)
    await waitFor(() => expect(loadPage).toHaveBeenCalledTimes(3))
    const oldSignal = loadPage.mock.calls[0][3]
    // when
    rerender(<CardPage boardId="new" loadPage={loadPage} />)
    act(() => resolveOld({ items: [], nextCursor: null }))
    // then
    expect(oldSignal.aborted).toBe(true)
    expect(await screen.findByText('아직 시작 전 카드가 없습니다.')).toBeInTheDocument()
    expect(loadPage.mock.calls.some(call => call[0] === 'new' && call[2] === 0)).toBe(true)
  })
})
