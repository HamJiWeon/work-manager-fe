export const CARD_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'] as const
export type CardStatus = typeof CARD_STATUSES[number]
export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  NOT_STARTED: '시작 전', IN_PROGRESS: '진행 중', DONE: '완료',
}
export interface CardItem {
  id: string
  boardId: string
  cardNumber: number
  memberAvatarUrl?: string
  startDate?: string
  endDate?: string
  memberName: string
  projectCode: string
  title: string
  content: string
  status: CardStatus
}
/** 프로젝트 코드와 서버에서 부여한 카드 번호를 결합해 화면용 식별자를 만든다. */
export function formatCardCode(card: Pick<CardItem, 'projectCode' | 'cardNumber'>): string {
  return `${card.projectCode}-${card.cardNumber}`
}

export interface CardPage {
  items: CardItem[]
  nextCursor: number | null
}
export type CardPageLoader = (boardId: string, status: CardStatus, cursor: number, signal: AbortSignal) => Promise<CardPage>
const PAGE_SIZE = 8
const SAMPLE_CARD_COUNT = 24
const SAMPLE_MEMBER_NAMES = ['김민수', '이서연', '박지훈'] as const
/** 예시 담당자의 프로필 경로를 반환하며, 사진이 없는 담당자는 이니셜 표시를 사용한다. */
export function getMemberAvatarUrl(memberName: string): string | undefined {
  if (memberName === '나') return '/avatars/member-1.svg'
  const index = SAMPLE_MEMBER_NAMES.findIndex(name => name === memberName)
  return index < 0 ? undefined : `/avatars/member-${index + 1}.svg`
}
const SAMPLE_PROJECT_CODE = 'PJT'
const FIRST_CARDS: Record<CardStatus, { title: string; content: string }> = {
  NOT_STARTED: { title: 'Team', content: '팀 생성 및 멤버 관리' },
  IN_PROGRESS: { title: 'User', content: '사용자 정보 조회 및 프로필 관리' },
  DONE: { title: 'Login', content: '로그인 및 로그아웃' },
}

/** 카드 API가 제공되기 전까지 보드·상태별 예시 데이터를 페이지 단위로 반환한다. */
export const loadSampleCardPage: CardPageLoader = async (boardId, status, cursor, signal) => {
  signal.throwIfAborted()
  const end = Math.min(cursor + PAGE_SIZE, SAMPLE_CARD_COUNT)
  return {
    items: Array.from({ length: end - cursor }, (_, index) => {
      const position = cursor + index
      return {
        id: `${boardId}-${status}-${position}`, boardId, status,
        cardNumber: CARD_STATUSES.indexOf(status) * SAMPLE_CARD_COUNT + position + 1,
        memberName: SAMPLE_MEMBER_NAMES[position % SAMPLE_MEMBER_NAMES.length],
        memberAvatarUrl: `/avatars/member-${position % SAMPLE_MEMBER_NAMES.length + 1}.svg`,
        projectCode: SAMPLE_PROJECT_CODE,
        title: position === 0 ? FIRST_CARDS[status].title : `${FIRST_CARDS[status].title} 작업 ${position + 1}`,
        content: FIRST_CARDS[status].content,
      }
    }),
    nextCursor: end < SAMPLE_CARD_COUNT ? end : null,
  }
}

/** 저장된 ISO 날짜를 카드 목록에 표시할 두 자리 연도 형식으로 변환한다. */
export function formatCardDate(date: string): string {
  return date.replace(/^\d{2}(\d{2}-\d{2}-\d{2})$/, '$1')
}
