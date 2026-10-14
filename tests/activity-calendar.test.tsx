import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActivityCalendar } from '@/components/activity-calendar'
import { getYearDays } from '@/lib/activity'

describe('annual_activity', () => {
  it('select_date_year_and_disable_future_ok', async () => {
    // given
    const user = userEvent.setup()
    const onSelectDate = vi.fn()
    const onYearChange = vi.fn()
    render(<ActivityCalendar days={getYearDays(2026)} year={2026} today="2026-09-09" counts={new Map([['2026-09-09', 3]])} selectedDate={null} onSelectDate={onSelectDate} onYearChange={onYearChange} />)
    // when
    await user.click(screen.getByRole('button', { name: '2026-09-09 오늘 · 완료한 작업 3개' }))
    await user.click(screen.getByRole('button', { name: '2025' }))
    // then
    expect(onSelectDate).toHaveBeenCalledWith('2026-09-09')
    expect(onYearChange).toHaveBeenCalledWith(2025)
    expect(screen.getByRole('button', { name: '2026' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '2026-09-10 · 예정된 날짜' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2026-01-01 · 완료한 작업 0개' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: '2026년 작업 완료 3개' })).toBeVisible()
  })

  it('year_days_include_leap_day_and_year_boundaries_ok', () => {
    // when
    const days = getYearDays(2024)
    // then
    expect(days).toHaveLength(366)
    expect(days.some(day => day.date === '2024-02-29')).toBe(true)
    expect(days[0].date).toBe('2024-01-01')
    expect(days.at(-1)?.date).toBe('2024-12-31')
    expect(getYearDays(2025)).toHaveLength(365)
  })
})
