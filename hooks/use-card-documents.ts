"use client"

import { useSyncExternalStore } from 'react'
import { CARD_DOCUMENT_CHANGE_EVENT, readBoardDocuments, type SavedCardDocument } from '@/lib/card-document'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CARD_DOCUMENT_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CARD_DOCUMENT_CHANGE_EVENT, onChange)
  }
}

/** 브라우저 저장소를 구독해 저장된 카드 제목과 본문을 복원하고 같은 창 및 다른 탭의 변경을 반영한다. */
export function useCardDocuments(boardId: string): Record<string, SavedCardDocument> {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(readBoardDocuments(boardId)), () => '{}')
  return JSON.parse(snapshot) as Record<string, SavedCardDocument>
}
