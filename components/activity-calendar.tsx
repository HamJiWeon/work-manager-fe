import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DAYS_IN_WEEK, shiftMonth, type ActivityDay } from '@/lib/activity'

const MAX_ACTIVITY_DOTS = 3
const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface ActivityCalendarProps {
  days: ActivityDay[]
  month: string
  today: string
  counts: Map<string, number>
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onMonthChange: (month: string) => void
}

/** 월별 완료 기록을 점으로 요약하고 앞뒤 달 날짜는 흐린 비활성 칸으로 표시한다. */
export function ActivityCalendar({ days, month, today, counts, selectedDate, onSelectDate, onMonthChange }: ActivityCalendarProps) {
  const offset = days[0]?.weekday ?? 0
  const cellCount = Math.ceil((offset + days.length) / DAYS_IN_WEEK) * DAYS_IN_WEEK
  const currentMonth = today.slice(0, 7)

  return <section className="activity-calendar" aria-label="월간 작업 캘린더">
    <div className="calendar-toolbar">
      <div className="calendar-navigation">
        <button className="icon-button" aria-label="이전 달" onClick={() => onMonthChange(shiftMonth(month, -1))}><ChevronLeft size={17} /></button>
        <h3 aria-live="polite">{month.slice(0, 4)}년 {Number(month.slice(5))}월</h3>
        <button className="icon-button" aria-label="다음 달" disabled={month >= currentMonth} onClick={() => onMonthChange(shiftMonth(month, 1))}><ChevronRight size={17} /></button>
      </div>
      <p className="calendar-total">이번 달 완료 <strong>{Array.from(counts.values()).reduce((sum, count) => sum + count, 0)}개</strong></p>
    </div>
    <div className="calendar-weekdays" aria-hidden="true">{WEEKDAY_LABELS.map(label => <span key={label}>{label}</span>)}</div>
    <div className="calendar-grid">
      {Array.from({ length: cellCount }, (_, index) => {
        const day = days[index - offset]
        if (!day) {
          const adjacentDate = new Date(month + '-01T00:00:00Z')
          adjacentDate.setUTCDate(index - offset + 1)
          const dateLabel = adjacentDate.toISOString().slice(0, 10)
          return <button type="button" className="calendar-day adjacent-month" key={dateLabel} disabled aria-label={`${dateLabel} · ${index < offset ? '이전' : '다음'} 달`}>
            <span className="calendar-date">{adjacentDate.getUTCDate()}</span>
          </button>
        }
        const count = counts.get(day.date) ?? 0
        const isFuture = day.date > today
        const isToday = day.date === today
        return <button key={day.date} className={`calendar-day ${isToday ? 'is-today' : ''}`} disabled={isFuture} aria-label={`${day.date}${isToday ? ' 오늘' : ''} · ${isFuture ? '예정된 날짜' : `완료한 작업 ${count}개`}`} aria-pressed={day.date === selectedDate} aria-current={isToday ? 'date' : undefined} onClick={() => onSelectDate(day.date)}>
          <span className="calendar-date">{day.day}</span>
          <span className="calendar-dots" aria-hidden="true">{Array.from({ length: Math.min(count, MAX_ACTIVITY_DOTS) }, (_, dot) => <span key={dot} />)}</span>
        </button>
      })}
    </div>
  </section>
}
