"use client"

import { useLayoutEffect, useRef, type RefObject } from 'react'

const SLIDE_DURATION_MS = 260
const SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CARD_SELECTOR = '[data-card-id]'

/** 카드의 변경 전후 위치 차이를 슬라이드로 연결한다. 드래그 원점을 유지하고 모션 감소 설정을 따른다. */
export function useCardMotion(root: RefObject<HTMLDivElement | null>, order: unknown, moved: unknown, preview: unknown) {
  const positions = useRef(new Map<string, DOMRect>())
  const dragOrigin = useRef<{ id: string; bounds: DOMRect } | null>(null)
  const animations = useRef<Animation[]>([])
  const handleCapturePositions = () => {
    positions.current.clear()
    root.current?.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach(element => {
      const id = element.dataset.cardId!
      if (!element.hidden) positions.current.set(id, element.getBoundingClientRect())
      else if (dragOrigin.current?.id === id) positions.current.set(id, dragOrigin.current.bounds)
    })
  }
  const handleRememberDrag = (id: string) => {
    const element = Array.from(root.current?.querySelectorAll<HTMLElement>(CARD_SELECTOR) ?? []).find(item => item.dataset.cardId === id)
    dragOrigin.current = element ? { id, bounds: element.getBoundingClientRect() } : null
  }
  useLayoutEffect(() => {
    if (!positions.current.size) return
    const previous = new Map(positions.current)
    positions.current.clear()
    animations.current.forEach(animation => animation.cancel())
    animations.current = []
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    root.current?.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach(element => {
      if (element.hidden || typeof element.animate !== 'function') return
      const before = previous.get(element.dataset.cardId!)
      if (!before) return
      const after = element.getBoundingClientRect()
      const x = before.left - after.left
      const y = before.top - after.top
      if (!x && !y) return
      animations.current.push(element.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }], { duration: SLIDE_DURATION_MS, easing: SLIDE_EASING }))
    })
  }, [root, order, moved, preview])
  useLayoutEffect(() => () => { animations.current.forEach(animation => animation.cancel()) }, [])
  return { handleCapturePositions, handleRememberDrag }
}
