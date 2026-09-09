export const PROJECTS = [{ id: 'project-1', name: '프로젝트1' }, { id: 'project-2', name: '프로젝트2' }]
export const ALL_PROJECTS = 'all'
export const DAYS_IN_WEEK = 7
const DAY_MS = 86_400_000
const SAMPLE_TITLES = ['화면 구성 정리', '컴포넌트 구현', '사용자 흐름 점검', 'API 응답 확인', '접근성 개선', '문서 업데이트']

export interface CompletedTask { id: string; projectId: string; title: string; date: string }
export interface ActivityDay { date: string; weekday: number; month: number; day: number }

/** 서울 기준 오늘 날짜를 구해 서버와 클라이언트의 날짜 기준을 통일한다. */
export function getToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** 지정한 월의 실제 날짜를 생성하며 윤년과 월별 일수를 반영한다. */
export function getMonthDays(month: string): ActivityDay[] {
  const start = new Date(month + '-01T00:00:00Z')
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  const days: ActivityDay[] = []
  for (let time = start.getTime(); time < end.getTime(); time += DAY_MS) {
    const date = new Date(time)
    days.push({ date: date.toISOString().slice(0, 10), weekday: date.getUTCDay(), month: date.getUTCMonth() + 1, day: date.getUTCDate() })
  }
  return days
}

/** 연도 경계를 포함해 표시 월을 이동한다. */
export function shiftMonth(month: string, offset: number): string {
  const date = new Date(month + '-01T00:00:00Z')
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date.toISOString().slice(0, 7)
}

/** API 연결 전 화면 확인을 위한 재현 가능한 예시 완료 이력을 만든다. */
export function createSampleTasks(days: ActivityDay[]): CompletedTask[] {
  return days.flatMap(day => {
    const index = Math.floor(new Date(day.date + 'T00:00:00Z').getTime() / DAY_MS)
    const seed = (index * 17 + Math.floor(index / 7) * 13) % 23
    const count = seed < 10 || day.weekday === 0 ? 0 : seed % 6 + 1
    return Array.from({ length: count }, (_, taskIndex) => ({
      id: `${day.date}-${taskIndex}`, date: day.date,
      projectId: PROJECTS[(index + taskIndex) % PROJECTS.length].id,
      title: SAMPLE_TITLES[(index + taskIndex) % SAMPLE_TITLES.length],
    }))
  })
}

