"use client"

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { CARD_STATUS_LABELS, type CardStatus } from '@/lib/card'
import { createCard } from '@/lib/created-cards'

/** 상태 목록 아래에서 제목을 입력해 카드를 추가한다. 취소와 저장 실패 시 기존 목록을 보존한다. */
export function CardCreate({ boardId, status }: { boardId: string; status: CardStatus }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const label = CARD_STATUS_LABELS[status]
  const handleCancel = () => { setAdding(false); setTitle(''); setError('') }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) { setError('제목을 입력해 주세요.'); return }
    try { createCard(boardId, status, title); handleCancel() }
    catch { setError('카드를 저장하지 못했습니다. 다시 시도해 주세요.') }
  }
  return <div className="card-create">{adding ? <form aria-label={`${label} 카드 추가`} onSubmit={handleSubmit}>
    <input autoFocus aria-label={`${label} 새 카드 제목`} placeholder="카드 제목을 입력하세요" value={title} onChange={event => setTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') handleCancel() }} />
    {error && <p role="alert">{error}</p>}
    <div><button type="button" onClick={handleCancel}>취소</button><button type="submit">추가</button></div>
  </form> : <button className="card-add-button" aria-label={`${label} 카드 추가`} onClick={() => setAdding(true)}><Plus size={20} aria-hidden="true" /></button>}</div>
}
