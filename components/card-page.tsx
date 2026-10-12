"use client"

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Columns3, Rows3 } from 'lucide-react'
import type { DragEvent, FormEvent } from 'react'
import { CARD_STATUSES, CARD_STATUS_LABELS, formatCardCode, formatCardDate, getMemberAvatarUrl, loadSampleCardPage } from '@/lib/card'
import type { CardItem, CardPageLoader, CardStatus } from '@/lib/card'
import { useCardPages } from '@/hooks/use-card-pages'
import { CardDocument } from '@/components/card-document'
import { CardFilters } from '@/components/card-filters'
import { CardCreate } from '@/components/card-create'
import { useCreatedCards } from '@/hooks/use-created-cards'
import Image from 'next/image'
import type { SavedCardDocument } from '@/lib/card-document'
import { useCardDocuments } from '@/hooks/use-card-documents'
import { useCardMotion } from '@/hooks/use-card-motion'

const CARD_MOVE_THRESHOLD = 0.35

function CardMemberAvatar({ card }: { card: CardItem }) {
  return card.memberAvatarUrl ? <Image className="card-member" src={card.memberAvatarUrl} alt={`${card.memberName} 프로필 사진`} title={card.memberName} width={28} height={28} /> : <span className="detail-member-avatar" role="img" aria-label={`${card.memberName || '미지정'} 프로필 사진`} title={card.memberName || '미지정'}>{card.memberName.slice(0, 1) || '–'}</span>
}

interface CardPageProps {
  boardId: string
  loadPage?: CardPageLoader
  boardName?: string
  onOpenCard?: (card: CardItem) => void
  layout?: 'vertical' | 'horizontal'
  onLayoutChange?: (layout: 'vertical' | 'horizontal') => void
}

interface CardDropPreview {
  status: CardStatus
  targetId?: string
  edge: 'before' | 'after'
}

interface CardStatusSectionProps {
  boardId: string
  loadPage: CardPageLoader
  status: CardStatus
  layout: 'vertical' | 'horizontal'
  order: string[]
  movedCards: Record<string, CardItem>
  createdCards: CardItem[]
  documents: Record<string, SavedCardDocument>
  selectedCard: CardItem | null
  draggedCard: CardItem | null
  dropPreview: CardDropPreview | null
  onPreviewChange: (preview: CardDropPreview | null) => void
  onOpenCard: (card: CardItem) => void
  onSelectCard: (card: CardItem) => void
  onDragCard: (card: CardItem | null) => void
  onMoveCard: (card: CardItem, status: CardStatus, orderedIds: string[]) => void
}

function CardStatusSection({ boardId, status, loadPage, layout, order, movedCards, createdCards, documents, selectedCard, draggedCard, dropPreview, onPreviewChange, onOpenCard, onSelectCard, onDragCard, onMoveCard }: CardStatusSectionProps) {
  const { items, loading, error, hasMore, handleLoadMore } = useCardPages(boardId, status, loadPage)
  const root = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const loadMore = useRef(handleLoadMore)
  useEffect(() => { loadMore.current = handleLoadMore }, [handleLoadMore])
  useEffect(() => {
    if (loading || error || !hasMore || !sentinel.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMore.current()
    }, { root: root.current, rootMargin: layout === 'horizontal' ? '0px 120px 0px 0px' : '0px 0px 120px 0px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [loading, error, hasMore, layout])
  const availableItems = [
    ...items.filter(item => !movedCards[item.id]),
    ...createdCards.filter(item => item.status === status && !movedCards[item.id]),
    ...Object.values(movedCards).filter(item => item.boardId === boardId && item.status === status),
  ].map((item): CardItem => {
    const saved = documents[item.id]
    return { ...item, ...saved, memberAvatarUrl: saved?.memberName !== undefined ? getMemberAvatarUrl(saved.memberName) : item.memberAvatarUrl }
  })
  const cardsById = new Map(availableItems.map(item => [item.id, item]))
  const visibleItems = [
    ...order.flatMap(id => cardsById.has(id) ? [cardsById.get(id)!] : []),
    ...availableItems.filter(item => !order.includes(item.id)),
  ]
  const renderItems = visibleItems.map(item => ({ item, preview: false }))
  if (draggedCard && dropPreview?.status === status) {
    const targetIndex = dropPreview.targetId ? renderItems.findIndex(entry => entry.item.id === dropPreview.targetId) : -1
    const position = targetIndex < 0 ? renderItems.length : targetIndex + (dropPreview.edge === 'after' ? 1 : 0)
    renderItems.splice(position, 0, { item: { ...draggedCard, status }, preview: true })
  }
  const previewCount = visibleItems.length - (draggedCard && dropPreview && visibleItems.some(item => item.id === draggedCard.id) ? 1 : 0) + (draggedCard && dropPreview?.status === status ? 1 : 0)
  const handlePlaceCard = (card: CardItem, targetId?: string, edge: 'before' | 'after' = 'before') => {
    if (card.id === targetId) return
    const orderedIds = visibleItems.filter(item => item.id !== card.id).map(item => item.id)
    const targetIndex = targetId ? orderedIds.indexOf(targetId) : -1
    const position = targetIndex < 0 ? orderedIds.length : targetIndex + (edge === 'after' ? 1 : 0)
    orderedIds.splice(position, 0, card.id)
    onMoveCard(card, status, orderedIds)
    onPreviewChange(null)
  }
  const handlePositionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCard) return
    const values = new FormData(event.currentTarget)
    const target = String(values.get('target'))
    handlePlaceCard(selectedCard, target || undefined, values.get('edge') === 'after' ? 'after' : 'before')
  }
  const getPointerPreview = (event: DragEvent<HTMLElement>): CardDropPreview | null => {
    const previewElement = root.current?.querySelector<HTMLElement>('.card-preview-slot')
    if (previewElement && dropPreview?.status === status) {
      const bounds = previewElement.getBoundingClientRect()
      if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) return dropPreview
    }
    const horizontal = layout === 'horizontal'
    const pointer = horizontal ? event.clientX : event.clientY
    const targets = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? [])
      .filter(element => element.dataset.cardId !== draggedCard?.id && !element.hidden)
    const hoveredElement = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-card-id]') : null
    const hoveredIndex = targets.findIndex(element => element === hoveredElement)
    if (hoveredIndex >= 0) {
      const bounds = targets[hoveredIndex].getBoundingClientRect()
      const midpoint = horizontal ? bounds.left + bounds.width * CARD_MOVE_THRESHOLD : bounds.top + bounds.height * CARD_MOVE_THRESHOLD
      let before = pointer < midpoint
      if (draggedCard?.status === status || dropPreview?.status === status) {
        const sourceIndex = visibleItems.findIndex(item => item.id === draggedCard?.id)
        const anchorIndex = dropPreview?.targetId ? targets.findIndex(element => element.dataset.cardId === dropPreview.targetId) : targets.length
        const currentIndex = dropPreview?.status === status ? anchorIndex : sourceIndex
        const movingForward = hoveredIndex >= currentIndex
        const threshold = movingForward ? midpoint : (horizontal ? bounds.right - bounds.width * CARD_MOVE_THRESHOLD : bounds.bottom - bounds.height * CARD_MOVE_THRESHOLD)
        if (movingForward ? pointer <= threshold : pointer >= threshold) return dropPreview?.status === status ? dropPreview : null
        before = !movingForward
      }
      const anchor = targets[hoveredIndex + (before ? 0 : 1)]
      return anchor ? { status, targetId: anchor.dataset.cardId, edge: 'before' } : { status, edge: 'after' }
    }
    const target = targets.find(element => {
      const bounds = element.getBoundingClientRect()
      return pointer < (horizontal ? bounds.left + bounds.width * CARD_MOVE_THRESHOLD : bounds.top + bounds.height * CARD_MOVE_THRESHOLD)
    })
    return target ? { status, targetId: target.dataset.cardId, edge: 'before' } : { status, edge: 'after' }
  }
  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!draggedCard) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    const nextPreview = getPointerPreview(event)
    if (dropPreview?.status !== nextPreview?.status || dropPreview?.targetId !== nextPreview?.targetId || dropPreview?.edge !== nextPreview?.edge) onPreviewChange(nextPreview)
  }
  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const position = dropPreview?.status === status ? dropPreview : getPointerPreview(event)
    if (draggedCard && position) handlePlaceCard(draggedCard, position.targetId, position.edge)
    onDragCard(null)
    onPreviewChange(null)
  }
  const label = CARD_STATUS_LABELS[status]
  const headingId = `card-status-${status}`
  return <section className={`card-status-section status-${status.toLowerCase()} ${draggedCard && draggedCard.status !== status ? 'card-drop-target' : ''}`} aria-labelledby={headingId}
    onDragOver={handleDragOver}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null) && dropPreview?.status === status) onPreviewChange(null) }} onDrop={handleDrop}>
    <div className="section-heading"><h3 id={headingId}>{label}</h3><span className="count-badge" aria-label={`${label} 불러온 카드 수`}>{previewCount}</span>
      {selectedCard && <details className="card-move-menu" key={selectedCard.id}>
        <summary aria-label={`${label} 위치 지정`}>이동 <ChevronDown size={13} aria-hidden="true" /></summary>
        <div className="card-move-popover">
          <strong>{selectedCard.title}</strong><p>{label} 목록에서 놓을 위치를 선택하세요.</p>
          <form onSubmit={handlePositionSubmit}>
            <label>기준 카드<select name="target" aria-label={`${label} 기준 카드`}><option value="">목록 맨 뒤</option>{visibleItems.filter(item => item.id !== selectedCard.id).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <label>위치<select name="edge" aria-label={`${label} 이동 위치`}><option value="before">앞에 놓기</option><option value="after">뒤에 놓기</option></select></label>
            <button type="submit">이 위치로 이동 <ArrowRight size={14} aria-hidden="true" /></button>
          </form>
          {selectedCard.status !== status && <button className="card-quick-move" onClick={() => handlePlaceCard(selectedCard)}>{label}{status === 'DONE' ? '로' : '으로'} 이동</button>}
        </div>
      </details>}
    </div>
    <div className="card-scroll" ref={root} role="region" aria-label={`${label} 카드 목록`} tabIndex={0} aria-busy={loading}>
      <ul className="card-list">{renderItems.map(({ item, preview }) => preview ? <li key="drop-preview" className="card-preview-slot"
        onDragOver={event => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move' }}
        onDrop={event => { event.stopPropagation(); handleDrop(event) }}>
        <article className="work-card card-drop-preview" aria-label={`${item.title} 이동 미리보기`}>
          <div className="card-select-button"><span className="card-topline"><strong className="card-project-code" aria-label="카드 코드">{formatCardCode(item)}</strong><span className="card-preview-caption">이 위치에 놓기</span></span><h4>{item.title}</h4><span className="card-metadata">{(item.startDate || item.endDate) && <span className="card-date-summary" aria-label="작업 기간"><span>{item.startDate ? <time dateTime={item.startDate}>{formatCardDate(item.startDate)}</time> : '시작일 미지정'}</span><span aria-hidden="true">~</span><span>{item.endDate ? <time dateTime={item.endDate}>{formatCardDate(item.endDate)}</time> : '종료일 미지정'}</span></span>}<CardMemberAvatar card={item} /></span></div>
        </article>
      </li> : <li key={item.id} data-card-id={item.id} hidden={!!dropPreview && draggedCard?.id === item.id}
        onDragOver={handleDragOver} onDrop={handleDrop}><article className={`work-card ${selectedCard?.id === item.id ? 'selected' : ''} ${draggedCard?.id === item.id ? 'dragging' : ''}`} draggable
        onDragStart={event => { event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; onDragCard(item) }}
        onDragEnd={() => { onDragCard(null); onPreviewChange(null) }}><button className="card-select-button" aria-label={`${item.title} 카드 열기`} aria-pressed={selectedCard?.id === item.id} onClick={() => onOpenCard(item)} aria-keyshortcuts="Space" onKeyDown={event => { if (event.key === ' ') { event.preventDefault(); onSelectCard(item) } }}><span className="card-topline"><strong className="card-project-code" aria-label="카드 코드">{formatCardCode(item)}</strong></span><h4>{item.title}</h4><span className="card-metadata">{(item.startDate || item.endDate) && <span className="card-date-summary" aria-label="작업 기간"><span>{item.startDate ? <time dateTime={item.startDate}>{formatCardDate(item.startDate)}</time> : '시작일 미지정'}</span><span aria-hidden="true">~</span><span>{item.endDate ? <time dateTime={item.endDate}>{formatCardDate(item.endDate)}</time> : '종료일 미지정'}</span></span>}<CardMemberAvatar card={item} /></span></button></article>
      </li>)}</ul>
      <div aria-live="polite">
        {loading && <p role="status">카드를 불러오는 중입니다.</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && previewCount === 0 && <p>아직 {label} 카드가 없습니다.</p>}
        {!loading && !error && !hasMore && visibleItems.length > 0 && <p className="card-end">모든 카드를 불러왔습니다.</p>}
      </div>
      <div ref={sentinel} className="card-sentinel" aria-hidden="true" />
      {!loading && (error || hasMore) && <button className="card-load-more" onClick={handleLoadMore}>{error ? `${label} 다시 시도` : `${label} 더 불러오기`}</button>}
    </div>
    <CardCreate boardId={boardId} status={status} />
  </section>
}

/** 보드별 상태 목록과 무한 스크롤을 제공하며 카드 클릭 시 별도 Markdown 상세 화면을 연다. 카드 이동의 서버 저장은 API 연동이 필요하다. */
export function CardPage({ boardId, boardName, onOpenCard, layout: preferredLayout, onLayoutChange, loadPage = loadSampleCardPage }: CardPageProps) {
  const [cardOrders, setCardOrders] = useState<Record<string, string[]>>({})
  const [movedCards, setMovedCards] = useState<Record<string, CardItem>>({})
  const [openedCard, setOpenedCard] = useState<CardItem | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null)
  const [dropPreview, setDropPreview] = useState<CardDropPreview | null>(null)
  const [draggedCard, setDraggedCard] = useState<CardItem | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const cardLayout = useRef<HTMLDivElement>(null)
  const { handleCapturePositions, handleRememberDrag } = useCardMotion(cardLayout, cardOrders, movedCards, dropPreview)
  const handlePreviewChange = (preview: CardDropPreview | null) => {
    handleCapturePositions()
    setDropPreview(preview)
  }
  const documents = useCardDocuments(boardId)
  const createdCards = useCreatedCards(boardId)
  const handleDocumentSave = (document: SavedCardDocument) => {
    if (!openedCard) return
    setSelectedCard(current => current?.id === openedCard.id ? { ...current, ...document } : current)
  }
  const handleDragCard = (card: CardItem | null) => {
    if (card) handleRememberDrag(card.id)
    setDraggedCard(card)
    setDropPreview(null)
  }
  const handleSelectCard = (card: CardItem) => setSelectedCard(current => current?.id === card.id ? null : card)
  const handleMoveCard = (card: CardItem, status: CardStatus, orderedIds: string[]) => {
    if (card.boardId !== boardId) return
    handleCapturePositions()
    setCardOrders(current => ({ ...current, [`${boardId}:${status}`]: orderedIds }))
    setMovedCards(current => ({ ...current, [card.id]: { ...card, status } }))
    setSelectedCard(null)
    handleDragCard(null)
    setAnnouncement(`${card.title} 카드를 ${CARD_STATUS_LABELS[status]}${status === 'DONE' ? '로' : '으로'} 이동했습니다.`)
  }
  const [localLayout, setLocalLayout] = useState<'vertical' | 'horizontal'>('vertical')
  const layout = preferredLayout ?? localLayout
  const handleLayoutChange = (value: 'vertical' | 'horizontal') => {
    setLocalLayout(value)
    onLayoutChange?.(value)
  }
  return <>
    <div hidden={openedCard !== null}>
    <div className="page-heading"><div><h2 className="project-overview-title">{boardName ?? `보드${boardId.slice(-1)}`}</h2></div><span className="sample-badge">예시 데이터</span></div>

    <p className="sr-only" aria-live="polite">{announcement}</p>
    <div className="card-controls"><CardFilters key={boardId} />{selectedCard?.boardId === boardId && <p className="card-move-hint"><span className="selected-card-dot" />{selectedCard.title} 선택됨 <button onClick={() => setSelectedCard(null)}>선택 해제</button></p>}
    <div className="card-toolbar" role="group" aria-label="상태 배치 선택">
      <button aria-pressed={layout === 'vertical'} onClick={() => handleLayoutChange('vertical')}><Columns3 size={15} aria-hidden="true" />세로 배치</button>
      <button aria-pressed={layout === 'horizontal'} onClick={() => handleLayoutChange('horizontal')}><Rows3 size={15} aria-hidden="true" />가로 배치</button>
    </div>
    </div>
    <div ref={cardLayout} className={`card-status-layout ${layout}`} onDragEnd={() => handleDragCard(null)} onKeyDown={event => { if (event.key === 'Escape') handleDragCard(null) }}>
      {CARD_STATUSES.map(status => <CardStatusSection key={`${boardId}-${status}`} boardId={boardId} status={status} loadPage={loadPage} layout={layout} order={cardOrders[`${boardId}:${status}`] ?? []} movedCards={movedCards} createdCards={createdCards} documents={documents} selectedCard={selectedCard?.boardId === boardId ? selectedCard : null} draggedCard={draggedCard?.boardId === boardId ? draggedCard : null} onOpenCard={onOpenCard ?? setOpenedCard} onSelectCard={handleSelectCard} dropPreview={dropPreview} onPreviewChange={handlePreviewChange} onDragCard={handleDragCard} onMoveCard={handleMoveCard} />)}
    </div>
    </div>
    {openedCard?.boardId === boardId && <CardDocument key={openedCard.id} card={openedCard} onSave={handleDocumentSave} onClose={() => setOpenedCard(null)} />}
  </>
}
