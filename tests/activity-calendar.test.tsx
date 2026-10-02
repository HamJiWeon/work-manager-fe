import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActivityCalendar } from '@/components/activity-calendar'
import { getMonthDays, shiftMonth } from '@/lib/activity'

describe('activity_calendar', () => {
  it('select_date_and_move_month_ok', async () => {
    // given
    const user = userEvent.setup()
    const onSelectDate = vi.fn()
    const onMonthChange = vi.fn()
    render(<ActivityCalendar days={getMonthDays('2026-09')} month="2026-09" today="2026-09-09" counts={new Map([['2026-09-09', 3]])} selectedDate={null} onSelectDate={onSelectDate} onMonthChange={onMonthChange} />)
    // when
    await user.click(screen.getByRole('button', { name: '2026-09-09 오늘 · 완료한 작업 3개' }))
    await user.click(screen.getByRole('button', { name: '이전 달' }))
    // then
    expect(onSelectDate).toHaveBeenCalledWith('2026-09-09')
    expect(onMonthChange).toHaveBeenCalledWith('2026-08')
    expect(screen.getByRole('button', { name: '다음 달' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2026-09-10 · 예정된 날짜' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2026-08-31 · 이전 달' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2026-10-01 · 다음 달' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2026-09-01 · 완료한 작업 0개' })).toBeEnabled()
  })

  it('handle_leap_year_and_year_boundary_ok', () => {
    // given
    const leapMonth = '2024-02'
    // when
    const days = getMonthDays(leapMonth)
    // then
    expect(days).toHaveLength(29)
    expect(days.at(-1)?.date).toBe('2024-02-29')
    expect(getMonthDays('2025-02')).toHaveLength(28)
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
  })
})
