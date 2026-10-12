"use client"

import { useId, useState } from 'react'
import { MarkdownPreview } from '@/components/markdown-preview'
import { useMarkdownEditor } from '@/hooks/use-markdown-editor'
import { MARKDOWN_ACTIONS } from '@/lib/markdown-editor'
import type { SavedCardDocument } from '@/lib/card-document'

interface MarkdownDocumentProps {
  initialDocument: SavedCardDocument
  readDocument: () => SavedCardDocument | null
  saveDocument: (document: SavedCardDocument) => void
  onClose: () => void
  backLabel: string
  titleLabel: string
  onSave?: (document: SavedCardDocument) => void
  hideBackButton?: boolean
  initialEditing?: boolean
}

/** 제목과 Markdown을 함께 편집하고 지정된 저장 방식으로 저장한다. 저장 실패 시 초안을 유지하며 오류를 표시한다. */
export function MarkdownDocument({ initialDocument, readDocument, saveDocument, onClose, backLabel, titleLabel, onSave, initialEditing, hideBackButton }: MarkdownDocumentProps) {
  const titleId = useId()
  const markdownId = useId()
  const [saved] = useState(readDocument)
  const [title, setTitle] = useState(saved?.title ?? initialDocument.title)
  const [draftTitle, setDraftTitle] = useState(title)
  const [content, setContent] = useState(saved?.content ?? initialDocument.content)
  const [editing, setEditing] = useState(initialEditing ?? saved === null)
  const [error, setError] = useState('')
  const handleSave = (value: string) => {
    const nextTitle = draftTitle.trim()
    if (!nextTitle) { setError('제목을 입력해 주세요.'); return }
    const document = { title: nextTitle, content: value }
    try {
      saveDocument(document)
      setTitle(nextTitle)
      setDraftTitle(nextTitle)
      setContent(value)
      setEditing(false)
      setError('')
      onSave?.(document)
    } catch { setError('저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도하세요.') }
  }
  const { draft, textarea, handleFormat, handleChange, handleKeyDown, handleSelectionChange, handleReset } = useMarkdownEditor(content, handleSave)
  const handleCancel = () => {
    handleReset(content)
    setDraftTitle(title)
    setEditing(false)
    setError('')
  }
  return <>
    {!hideBackButton && <button className="common-back" onClick={onClose}>← {backLabel}</button>}
    <section className="card-document" aria-label={`${title} Markdown 문서`}>
    <div className="card-document-heading"><div>{editing ? <><label className="sr-only" htmlFor={titleId}>{titleLabel}</label><input id={titleId} className="card-document-title" value={draftTitle} onChange={event => setDraftTitle(event.target.value)} aria-invalid={error === '제목을 입력해 주세요.'} /></> : <h1 className="card-document-title">{title}</h1>}</div>
      <div className="card-document-actions">{editing ? <><button onClick={handleCancel}>취소</button><button className="card-document-save" onClick={() => handleSave(draft)}>저장</button></> : <button onClick={() => setEditing(true)}>편집</button>}</div>
    </div>
    {editing ? <><label className="sr-only" htmlFor={markdownId}>Markdown 작성</label>
      <div className="markdown-toolbar" role="toolbar" aria-label="Markdown 서식">
        {MARKDOWN_ACTIONS.map(action => <button key={action.id} type="button" aria-label={action.label} title={`${action.label} (⌘ / Ctrl + ${action.shortcut})`} onMouseDown={event => event.preventDefault()} onClick={() => handleFormat(action.id)}>{action.symbol}</button>)}
      </div>
      <textarea ref={textarea} id={markdownId} value={draft} onChange={handleChange} onKeyDown={handleKeyDown} onSelect={handleSelectionChange} autoFocus spellCheck={false} />
    </> : <><span className="sr-only" role="status">저장된 Markdown 미리보기</span><MarkdownPreview content={content} /></>}

    {error && <p role="alert">{error}</p>}
  </section>
  </>
}
