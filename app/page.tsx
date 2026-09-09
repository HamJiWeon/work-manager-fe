import { Workspace } from '@/components/workspace'
import { getToday } from '@/lib/activity'

export const dynamic = 'force-dynamic'

/** 요청 시점의 서울 날짜를 기준으로 작업 현황을 표시한다. */
export default function Page() {
  return <Workspace today={getToday()} />
}
