import { CARD_STATUSES, getMemberAvatarUrl, type CardItem, type CardStatus } from '@/lib/card'

export const CREATED_CARDS_CHANGE_EVENT = 'work-manager:created-cards-change'
const STORAGE_PREFIX = 'work-manager:created-cards:'
const SAMPLE_CARD_TOTAL = 72

function isCard(value: unknown): value is CardItem {
  if (typeof value !== 'object' || value === null) return false
  const card = value as Partial<CardItem>
  return typeof card.id === 'string' && typeof card.boardId === 'string' && typeof card.title === 'string' && typeof card.content === 'string' && typeof card.memberName === 'string' && typeof card.projectCode === 'string' && typeof card.cardNumber === 'number' && Number.isSafeInteger(card.cardNumber) && card.cardNumber > 0 && CARD_STATUSES.includes(card.status as CardStatus)
    && (card.memberAvatarUrl === undefined || typeof card.memberAvatarUrl === 'string')
    && (card.startDate === undefined || typeof card.startDate === 'string')
    && (card.endDate === undefined || typeof card.endDate === 'string')
}

/** 보드에서 직접 추가한 카드를 복원한다. 손상된 데이터와 다른 보드의 항목은 제외한다. */
export function readCreatedCards(boardId: string): CardItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${boardId}`) ?? '[]')
    return Array.isArray(value) ? value.filter(isCard).filter(card => card.boardId === boardId) : []
  } catch { return [] }
}

/** 예시 카드 번호 다음의 고유 번호로 제목과 내용을 담은 시작 전 카드를 저장한다. 저장 실패는 UI가 초안을 유지하도록 전달한다. */
export function createCard(boardId: string, title: string, content = '', details: Partial<Pick<CardItem, 'memberName' | 'startDate' | 'endDate'>> = {}): CardItem {
  const cards = readCreatedCards(boardId)
  const card: CardItem = {
    id: crypto.randomUUID(), boardId, status: 'NOT_STARTED', title: title.trim(), content,
    cardNumber: Math.max(SAMPLE_CARD_TOTAL, ...cards.map(item => item.cardNumber)) + 1,
    projectCode: 'PJT', memberName: details.memberName ?? '나', memberAvatarUrl: getMemberAvatarUrl(details.memberName ?? '나'),
    startDate: details.startDate, endDate: details.endDate,
  }
  if (!card.title) throw new Error('제목을 입력해 주세요.')
  if (card.startDate && card.endDate && card.startDate > card.endDate) throw new Error('종료일은 시작일 이후로 지정해 주세요.')
  localStorage.setItem(`${STORAGE_PREFIX}${boardId}`, JSON.stringify([...cards, card]))
  window.dispatchEvent(new Event(CREATED_CARDS_CHANGE_EVENT))
  return card
}
