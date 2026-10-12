import type { CardItem } from '@/lib/card'

export interface SavedCardDocument { title: string; content: string; memberName?: string; startDate?: string; endDate?: string }
export const CARD_DOCUMENT_CHANGE_EVENT = 'work-manager:card-document-change'
const STORAGE_PREFIX = 'work-manager:card-document:'

function isSavedCardDocument(value: unknown): value is SavedCardDocument {
  return typeof value === 'object' && value !== null
    && 'title' in value && typeof value.title === 'string'
    && 'content' in value && typeof value.content === 'string'
    && (!('memberName' in value) || value.memberName === undefined || typeof value.memberName === 'string')
    && (!('startDate' in value) || value.startDate === undefined || typeof value.startDate === 'string')
    && (!('endDate' in value) || value.endDate === undefined || typeof value.endDate === 'string')
}

/** 저장된 제목과 본문을 읽고, 이전 버전의 본문만 저장된 문서는 기존 제목으로 복원한다. */
export function readCardDocument(card: CardItem): SavedCardDocument | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${card.boardId}:${card.id}`)
    if (stored !== null) {
      const parsed: unknown = JSON.parse(stored)
      if (isSavedCardDocument(parsed)) return parsed
    }
    const legacy = localStorage.getItem(`work-manager:card-markdown:${card.boardId}:${card.id}`)
    return legacy === null ? null : { title: card.title, content: legacy }
  } catch { return null }
}

/** 제목과 Markdown 본문을 하나의 값으로 저장한다. 저장 오류는 호출자가 처리하도록 전달한다. */
export function saveCardDocument(card: CardItem, document: SavedCardDocument): void {
  localStorage.setItem(`${STORAGE_PREFIX}${card.boardId}:${card.id}`, JSON.stringify(document))
  window.dispatchEvent(new Event(CARD_DOCUMENT_CHANGE_EVENT))
}

/** 보드의 저장된 문서를 읽어 목록을 복원한다. 손상된 항목은 건너뛰며 저장소 접근이 불가능하면 빈 결과를 반환한다. */
export function readBoardDocuments(boardId: string): Record<string, SavedCardDocument> {
  const documents: Record<string, SavedCardDocument> = {}
  const prefix = `${STORAGE_PREFIX}${boardId}:`
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (!key?.startsWith(prefix)) continue
      try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
        if (isSavedCardDocument(value)) documents[key.slice(prefix.length)] = value
      } catch { continue }
    }
  } catch { return documents }
  return documents
}
