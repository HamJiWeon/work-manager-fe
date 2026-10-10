import { useEffect, useRef, useState } from 'react'
import type { CardItem, CardPageLoader, CardStatus } from '@/lib/card'

/** 상태별 페이지를 순서대로 추가하고 중복 요청과 화면 이탈 후 갱신을 방지한다. */
export function useCardPages(boardId: string, status: CardStatus, loadPage: CardPageLoader) {
  const [items, setItems] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const request = useRef<(() => void) | null>(null)

  useEffect(() => {
    let active = true
    let pending = false
    let cursor: number | null = 0
    const controller = new AbortController()
    const handleLoad = async () => {
      if (pending || cursor === null) return
      pending = true
      setLoading(true)
      setError(null)
      try {
        const page = await loadPage(boardId, status, cursor, controller.signal)
        if (!active) return
        setItems(current => [...current, ...page.items.filter(item => !current.some(existing => existing.id === item.id))])
        cursor = page.nextCursor
        setHasMore(cursor !== null)
      } catch {
        if (active) setError('카드를 불러오지 못했습니다.')
      } finally {
        pending = false
        if (active) setLoading(false)
      }
    }
    request.current = handleLoad
    void Promise.resolve().then(() => {
      if (!active) return
      setItems([])
      setHasMore(true)
      void handleLoad()
    })
    return () => { active = false; controller.abort(); request.current = null }
  }, [boardId, status, loadPage])

  return { items, loading, error, hasMore, handleLoadMore: () => request.current?.() }
}
