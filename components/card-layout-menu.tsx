"use client"

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Columns3, Rows3 } from 'lucide-react'

const LAYOUT_OPTIONS = [
  { value: 'vertical', label: '세로 배치', Icon: Columns3 },
  { value: 'horizontal', label: '가로 배치', Icon: Rows3 },
] as const

type CardLayout = typeof LAYOUT_OPTIONS[number]['value']

/** 선택 배치로 포커스를 옮기고 방향키·Home·End 탐색과 선택·닫기 후 포커스 복원을 제공한다. */
export function CardLayoutMenu({ layout, onLayoutChange }: { layout: CardLayout; onLayoutChange: (layout: CardLayout) => void }) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState<CardLayout>(layout)
  const root = useRef<HTMLDetailsElement>(null)
  useLayoutEffect(() => {
    if (open) root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
  }, [open, layout])
  const handleClose = () => { setOpen(false); root.current?.querySelector('summary')?.focus() }
  const handleKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); handleClose(); return }
    if (event.key === 'Tab') { setOpen(false); root.current?.querySelector('summary')?.focus(); return }
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    let next: number
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % items.length; break
      case 'ArrowUp': next = (index - 1 + items.length) % items.length; break
      case 'Home': next = 0; break
      case 'End': next = items.length - 1; break
      default: return
    }
    event.preventDefault()
    if (!open) { setFocused(layout); setOpen(true); return }
    items[next]?.focus()
  }
  const selected = LAYOUT_OPTIONS.find(option => option.value === layout)!
  return <details ref={root} className="card-toolbar" open={open} onKeyDown={handleKeyDown} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <summary role="button" aria-label={selected.label} aria-haspopup="menu" aria-expanded={open} aria-pressed="true" onClick={event => { event.preventDefault(); setFocused(layout); setOpen(value => !value) }}><selected.Icon size={15} aria-hidden="true" />{selected.label}<ChevronDown size={14} aria-hidden="true" /></summary>
    <div className="card-layout-menu" role="menu" aria-label="상태 배치 선택">
      {LAYOUT_OPTIONS.map(({ value, label, Icon }) => <button key={value} role="menuitemradio" tabIndex={open && focused === value ? 0 : -1} aria-checked={layout === value} onFocus={() => setFocused(value)} onClick={() => { onLayoutChange(value); handleClose() }}><Icon size={15} aria-hidden="true" />{label}</button>)}
    </div>
  </details>
}
