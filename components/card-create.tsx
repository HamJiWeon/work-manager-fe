"use client"

import { useId, useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Dialog } from '@base-ui/react/dialog'
import { CalendarDays, Maximize2, Minimize2, Plus, Users } from 'lucide-react'
import { createCard } from '@/lib/created-cards'
import { useMarkdownEditor } from '@/hooks/use-markdown-editor'
import { MARKDOWN_ACTIONS } from '@/lib/markdown-editor'

type CardCreateError = { type: 'title' | 'period' | 'form'; message: string }

/** 시작 전 카드 생성 창과 상세 페이지 형태의 확대 편집기를 제공하고 제목과 Markdown 내용을 저장한다. 저장 실패 시 초안을 유지한다. */
export function CardCreate({ boardId, expansionContainer }: { boardId: string; expansionContainer: RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [memberName, setMemberName] = useState('나')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<CardCreateError | null>(null)
  const fieldId = useId()
  const titleInput = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  useLayoutEffect(() => {
    if (open && expanded) titleInput.current?.focus()
    else if (!open && wasOpen.current) trigger.current?.focus()
    wasOpen.current = open
  }, [open, expanded])
  const handleSave = (content: string) => {
    if (!title.trim()) { setError({ type: 'title', message: '제목을 입력해 주세요.' }); return }
    if (startDate && endDate && startDate > endDate) { setError({ type: 'period', message: '종료일은 시작일 이후로 지정해 주세요.' }); return }
    try { createCard(boardId, title, content, { memberName, startDate, endDate }); setOpen(false); setExpanded(false) }
    catch { setError({ type: 'form', message: '카드를 저장하지 못했습니다. 다시 시도해 주세요.' }) }
  }
  const { draft, textarea, handleFormat, handleChange, handleKeyDown, handleSelectionChange, handleReset } = useMarkdownEditor('', handleSave)
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    setTitle(''); handleReset(''); setExpanded(false); setError(null); setMemberName('나'); setStartDate(''); setEndDate('')
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSave(draft)
  }
  const form = <form aria-label="카드 추가 입력" aria-describedby={error?.type === 'form' ? `${fieldId}-error` : undefined} className={expanded ? 'card-document card-create-page-editor' : undefined} onSubmit={handleSubmit}>
    <div className={expanded ? 'card-document-heading' : undefined}>
      <div><label className={expanded ? 'sr-only' : undefined} htmlFor={`${fieldId}-title`}>제목 <span>(필수)</span></label>
      <input ref={titleInput} id={`${fieldId}-title`} className={expanded ? 'card-document-title' : undefined} aria-label="시작 전 새 카드 제목" placeholder="카드 제목을 입력하세요" value={title} onChange={event => { setTitle(event.target.value); setError(current => current?.type === 'title' ? null : current) }} aria-invalid={error?.type === 'title'} aria-describedby={error?.type === 'title' ? `${fieldId}-error` : undefined} /></div>
      {expanded && <div className="card-document-actions"><button type="button" className="icon-button" aria-label="카드 추가 창 축소" onClick={() => setExpanded(false)}><Minimize2 size={18} aria-hidden="true" /></button><button type="button" onClick={() => handleOpenChange(false)}>취소</button><button type="submit" className="card-document-save">저장</button></div>}
    </div>
    <label className={expanded ? 'sr-only' : undefined} htmlFor={`${fieldId}-content`}>내용</label>
    {expanded && <div className="markdown-toolbar" role="toolbar" aria-label="Markdown 서식">{MARKDOWN_ACTIONS.map(action => <button key={action.id} type="button" aria-label={action.label} title={`${action.label} (⌘ / Ctrl + ${action.shortcut})`} onMouseDown={event => event.preventDefault()} onClick={() => handleFormat(action.id)}>{action.symbol}</button>)}</div>}
    <textarea ref={textarea} onKeyDown={handleKeyDown} onSelect={handleSelectionChange} id={`${fieldId}-content`} placeholder="카드 내용을 입력하세요" value={draft} onChange={handleChange} rows={5} />
    {error && <p id={`${fieldId}-error`} role="alert" className="board-create-error">{error.message}</p>}
    {!expanded && <div className="board-dialog-actions"><button type="button" onClick={() => handleOpenChange(false)}>취소</button><button type="submit" className="board-create-button">추가</button></div>}
  </form>
  return <div className="card-create"><Dialog.Root open={open && !expanded} onOpenChange={handleOpenChange}>
    <Dialog.Trigger ref={trigger} className="card-add-button" aria-label="시작 전 카드 추가"><Plus size={15} aria-hidden="true" />카드 추가</Dialog.Trigger>
    {open && !expanded && <Dialog.Portal>
      <Dialog.Backdrop className="board-dialog-backdrop" />
      <Dialog.Popup initialFocus={titleInput} finalFocus={false} className="board-dialog card-create-dialog">
        <div className="card-create-dialog-heading"><Dialog.Title className="board-dialog-title">카드 추가</Dialog.Title><button type="button" className="icon-button" aria-label="카드 추가 창 확대" onClick={() => setExpanded(true)}><Maximize2 size={18} aria-hidden="true" /></button></div>
        <Dialog.Description className="board-dialog-description">제목과 내용을 입력하면 시작 전 목록에 추가됩니다.</Dialog.Description>
        {form}
      </Dialog.Popup>
    </Dialog.Portal>}
  </Dialog.Root>
  {open && expanded && expansionContainer.current && createPortal(<section className="card-create-page" aria-label="새 카드 작성">
    <div className="card-detail-layout"><div className="card-detail-content">{form}</div>
      <aside className="card-detail-panel" aria-label="카드 세부 사항">
        <div className="card-detail-heading"><h2>세부 사항</h2></div>
        <dl><div><dt><Users size={15} aria-hidden="true" />담당자</dt><dd><select aria-label="담당자" value={memberName} onChange={event => setMemberName(event.target.value)}><option value="">미지정</option>{['김민수', '이서연', '박지훈', '나'].map(name => <option key={name}>{name}</option>)}</select></dd></div>
        <div><dt><CalendarDays size={15} aria-hidden="true" />시작일 ~ 종료일</dt><dd className="detail-date-fields">
          <label className="detail-date-field"><span>시작일</span><input type="date" aria-label="시작일" value={startDate} max={endDate || undefined} aria-invalid={error?.type === 'period'} aria-describedby={error?.type === 'period' ? `${fieldId}-error` : undefined} onChange={event => { setStartDate(event.target.value); setError(current => current?.type === 'period' ? null : current) }} /></label>
          <label className="detail-date-field"><span>종료일</span><input type="date" aria-label="종료일" value={endDate} min={startDate || undefined} aria-invalid={error?.type === 'period'} aria-describedby={error?.type === 'period' ? `${fieldId}-error` : undefined} onChange={event => { setEndDate(event.target.value); setError(current => current?.type === 'period' ? null : current) }} /></label>
        </dd></div></dl>
      </aside>
    </div>
  </section>, expansionContainer.current)}
  </div>
}
