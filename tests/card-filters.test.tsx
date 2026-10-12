import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CardFilters } from '@/components/card-filters'

describe('card_filters', () => {
  it('navigate_vertical_tabs_with_keyboard_and_single_tab_stop_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardFilters />)
    await user.click(screen.getByRole('button', { name: '필터' }))
    const members = screen.getByRole('tab', { name: '담당 멤버' })
    const period = screen.getByRole('tab', { name: '기간' })
    const code = screen.getByRole('tab', { name: '코드' })
    // when
    await user.tab()
    // then
    expect(members).toHaveFocus()
    expect(period).toHaveAttribute('tabindex', '-1')
    expect(code).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
    // when
    await user.keyboard('{ArrowDown}')
    // then
    expect(period).toHaveFocus()
    expect(period).toHaveAttribute('aria-selected', 'true')
    expect(period).toHaveAttribute('tabindex', '0')
    expect(members).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tabpanel', { name: '기간' })).toBeInTheDocument()
    // when
    await user.keyboard('{End}{ArrowDown}')
    // then
    expect(members).toHaveFocus()
    // when
    await user.keyboard('{ArrowUp}')
    // then
    expect(code).toHaveFocus()
    expect(screen.getByRole('tabpanel', { name: '코드' })).toBeInTheDocument()
    // when
    await user.keyboard('{Home}')
    // then
    expect(members).toHaveFocus()
    // when
    await user.keyboard('{End}')
    // then
    expect(code).toHaveFocus()
    // when
    await user.tab()
    await user.tab({ shift: true })
    // then
    expect(code).toHaveFocus()
  })

  it('search_select_clear_members_and_close_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardFilters />)
    // when
    await user.click(screen.getByRole('button', { name: '필터' }))
    await user.type(screen.getByRole('searchbox', { name: '담당 멤버 검색' }), '없는 이름')
    // then
    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument()
    // when
    await user.clear(screen.getByRole('searchbox', { name: '담당 멤버 검색' }))
    await user.click(screen.getByRole('checkbox', { name: '김민수' }))
    await user.click(screen.getByRole('checkbox', { name: '이서연' }))
    await user.click(screen.getByRole('checkbox', { name: '김민수' }))
    // then
    expect(screen.getByText('1/3 선택')).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '지우기' }))
    // then
    expect(screen.getByRole('checkbox', { name: '이서연' })).not.toBeChecked()
    // when
    await user.click(screen.getByRole('button', { name: '필터 닫기' }))
    // then
    expect(screen.getByRole('button', { name: '필터' })).toHaveFocus()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('clear_each_condition_reset_all_and_escape_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardFilters />)
    await user.click(screen.getByRole('button', { name: '필터' }))
    // when
    await user.click(screen.getByRole('tab', { name: '기간' }))
    await user.type(screen.getByLabelText('기간 시작'), '2026-10-10')
    await user.type(screen.getByLabelText('기간 종료'), '2026-10-12')
    await user.click(screen.getByRole('button', { name: '지우기' }))
    // then
    expect(screen.getByLabelText('기간 시작')).toHaveValue('')
    expect(screen.getByLabelText('기간 종료')).toHaveValue('')
    // when
    await user.click(screen.getByRole('tab', { name: '코드' }))
    await user.type(screen.getByRole('searchbox', { name: '코드' }), 'PJT-123')
    // then
    expect(screen.getByRole('searchbox', { name: '코드' })).toHaveValue('123')
    // when
    await user.click(screen.getByRole('button', { name: '지우기' }))
    await user.type(screen.getByRole('searchbox', { name: '코드' }), '42')
    await user.click(screen.getByRole('button', { name: '모두 지우기' }))
    // then
    expect(screen.getByRole('searchbox', { name: '코드' })).toHaveValue('')
    // when
    await user.keyboard('{Escape}')
    // then
    expect(screen.getByRole('button', { name: '필터' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('outside_click_closes_without_clearing_selection_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<><CardFilters /><button>바깥</button></>)
    await user.click(screen.getByRole('button', { name: '필터' }))
    await user.click(screen.getByRole('checkbox', { name: '박지훈' }))
    // when
    await user.click(screen.getByRole('button', { name: '바깥' }))
    await user.click(screen.getByRole('button', { name: '필터' }))
    // then
    expect(screen.getByRole('checkbox', { name: '박지훈' })).toBeChecked()
    // when
    await user.click(screen.getByRole('button', { name: '필터 지우기' }))
    // then
    expect(screen.getByRole('checkbox', { name: '박지훈' })).not.toBeChecked()
  })
})
