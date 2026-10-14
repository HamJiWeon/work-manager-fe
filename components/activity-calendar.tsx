import type { CSSProperties, ReactNode } from 'react'
import { DAYS_IN_WEEK, type ActivityDay } from '@/lib/activity'

const YEAR_OPTION_COUNT = 4
const MAX_ACTIVITY_LEVEL = 4
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface ActivityCalendarProps {
  days: ActivityDay[]
  year: number
  today: string
  counts: Map<string, number>
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onYearChange: (year: number) => void
  projectFilter?: ReactNode
}

/** 연간 작업량을 주별 잔디 그래프로 표시하고 연도와 날짜 선택을 제공한다. */
export function ActivityCalendar({ days, year, today, counts, selectedDate, onSelectDate, onYearChange, projectFilter }: ActivityCalendarProps) {
  const offset = days[0]?.weekday ?? 0
  const weeks = Math.ceil((offset + days.length) / DAYS_IN_WEEK)
  const currentYear = Number(today.slice(0, 4))
  const total = days.reduce((sum, day) => sum + (counts.get(day.date) ?? 0), 0)

  return <section className="annual-activity" aria-label="연간 작업 활동">
    <div className="annual-content">
      <div className="annual-toolbar">
        <h3 aria-live="polite">{year}년 작업 완료 {total}개</h3>
        <div className="calendar-summary">{projectFilter}</div>
      </div>
      <div className="annual-panel">
        <div className="annual-scroll">
          <div className="annual-grid-layout" style={{ '--weeks': weeks } as CSSProperties}>
            <div className="annual-months" aria-hidden="true">{days.filter(day => day.day === 1).map(day => <span key={day.date} style={{ gridColumn: Math.floor((offset + days.indexOf(day)) / DAYS_IN_WEEK) + 1 }}>{MONTH_LABELS[day.month - 1]}</span>)}</div>
            <div className="annual-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
            <div className="annual-days">
              {Array.from({ length: weeks * DAYS_IN_WEEK }, (_, index) => {
                const day = days[index - offset]
                if (!day) return <span key={`padding-${index}`} className="annual-padding" />
                const count = counts.get(day.date) ?? 0
                const future = day.date > today
                const level = Math.min(count, MAX_ACTIVITY_LEVEL)
                const label = `${day.date}${day.date === today ? ' 오늘' : ''} · ${future ? '예정된 날짜' : `완료한 작업 ${count}개`}`
                return <button key={day.date} className={`annual-day level-${level}`} disabled={future} aria-label={label} aria-pressed={day.date === selectedDate} aria-current={day.date === today ? 'date' : undefined} onClick={() => onSelectDate(day.date)}><span className="annual-tooltip">{label}</span></button>
              })}
            </div>
          </div>
        </div>
        <div className="annual-footer"><span>날짜를 선택해 완료한 작업을 확인하세요.</span><div className="legend" aria-label="작업량: 색이 진할수록 많음"><span>적음</span>{Array.from({ length: MAX_ACTIVITY_LEVEL + 1 }, (_, level) => <span key={level} className={`legend-cell level-${level}`} aria-hidden="true" />)}<span>많음</span></div></div>
      </div>
    </div>
    <nav className="annual-years" aria-label="작업 활동 연도 선택">{Array.from({ length: YEAR_OPTION_COUNT }, (_, index) => currentYear - index).map(value => <button key={value} aria-pressed={year === value} onClick={() => onYearChange(value)}>{value}</button>)}</nav>
  </section>
}
