"use client"

import { useState } from 'react'
import { CalendarDays, Users } from 'lucide-react'
import type { CardItem } from '@/lib/card'
import { readCardDocument, saveCardDocument, type SavedCardDocument } from '@/lib/card-document'
import { useCardDocuments } from '@/hooks/use-card-documents'

const MEMBERS = ['김민수', '이서연', '박지훈', '나'] as const

type DetailField = 'memberName' | 'startDate' | 'endDate'

/** 클릭한 항목만 편집하고 선택 즉시 저장한다. 잘못된 기간과 저장 실패는 기존 값을 유지하며 안내한다. */
export function CardDetails({ card, onSave }: { card: CardItem; onSave?: (document: SavedCardDocument) => void }) {
  const documents = useCardDocuments(card.boardId)
  const saved = documents[card.id]
  const current = { memberName: saved?.memberName ?? card.memberName, startDate: saved?.startDate ?? card.startDate ?? '', endDate: saved?.endDate ?? card.endDate ?? '' }
  const [editing, setEditing] = useState<DetailField | null>(null)
  const [error, setError] = useState('')
  const handleEdit = (field: DetailField) => { setError(''); setEditing(field) }
  const handleSave = (field: DetailField, value: string) => {
    const next = { ...current, [field]: value }
    if (next.startDate && next.endDate && next.startDate > next.endDate) { setError('종료일은 시작일 이후로 지정해 주세요.'); return }
    try {
      const document = { title: card.title, content: card.content, ...readCardDocument(card), [field]: value }
      saveCardDocument(card, document)
      onSave?.(document)
      setEditing(null)
      setError('')
    } catch { setError('저장하지 못했습니다. 다시 시도해 주세요.') }
  }
  return <aside className="card-detail-panel" aria-label="카드 세부 사항" onKeyDown={event => { if (event.key === 'Escape') { setEditing(null); setError('') } }}>
    <div className="card-detail-heading"><h2>세부 사항</h2></div>
    <dl><div><dt><Users size={15} aria-hidden="true" />담당자</dt><dd>
      {editing === 'memberName' ? <select autoFocus aria-label="담당자" value={current.memberName} onChange={event => handleSave('memberName', event.target.value)} onBlur={() => setEditing(null)}><option value="">미지정</option>{Array.from(new Set([...MEMBERS, card.memberName, current.memberName])).filter(Boolean).map(name => <option key={name}>{name}</option>)}</select> : <button type="button" className="detail-field-button" aria-label="담당자 변경" onClick={() => handleEdit('memberName')}><span className="detail-member-avatar" aria-hidden="true">{current.memberName.slice(0, 1) || '–'}</span>{current.memberName || '미지정'}</button>}
    </dd></div><div><dt><CalendarDays size={15} aria-hidden="true" />시작일 ~ 종료일</dt><dd className="detail-date-fields">
      {(['startDate', 'endDate'] as const).map(field => <div className="detail-date-field" key={field}><span>{field === 'startDate' ? '시작일' : '종료일'}</span>{editing === field ? <input autoFocus type="date" aria-label={field === 'startDate' ? '시작일' : '종료일'} value={current[field]} max={field === 'startDate' ? current.endDate || undefined : undefined} min={field === 'endDate' ? current.startDate || undefined : undefined} onChange={event => handleSave(field, event.target.value)} onBlur={() => setEditing(null)} /> : <button type="button" className="detail-field-button" aria-label={field === 'startDate' ? '시작일 변경' : '종료일 변경'} onClick={() => handleEdit(field)}>{current[field] || '날짜 미지정'}</button>}</div>)}
    </dd></div></dl>
    {error && <p role="alert">{error}</p>}
  </aside>
}
