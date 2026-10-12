"use client"

import { useSyncExternalStore } from 'react'
import { CREATED_CARDS_CHANGE_EVENT, readCreatedCards } from '@/lib/created-cards'
import type { CardItem } from '@/lib/card'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CREATED_CARDS_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CREATED_CARDS_CHANGE_EVENT, onChange)
  }
}

/** 직접 추가한 카드의 저장소 변경을 구독해 목록과 새로고침 후 복원을 동기화한다. */
export function useCreatedCards(boardId: string): CardItem[] {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(readCreatedCards(boardId)), () => '[]')
  return JSON.parse(snapshot) as CardItem[]
}
