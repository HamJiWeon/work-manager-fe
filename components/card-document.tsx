"use client"

import { useStorageUserId } from '@/components/storage-user'
import type { CardItem } from '@/lib/card'
import { CardDetails } from '@/components/card-details'
import { MarkdownDocument } from '@/components/markdown-document'
import { readCardDocument, saveCardDocument, type SavedCardDocument } from '@/lib/card-document'

interface CardDocumentProps {
  card: CardItem
  onClose: () => void
  hideBackButton?: boolean
  onSave?: (document: SavedCardDocument) => void
}

/** 카드별 저장 및 복원을 연결하고 미리보기를 먼저 표시한다. 편집 버튼으로 수정을 시작한다. */
export function CardDocument({ card, onClose, onSave, hideBackButton }: CardDocumentProps) {
  const storageUserId = useStorageUserId()
  return <div className="card-detail-layout"><div className="card-detail-content"><MarkdownDocument initialDocument={card} initialEditing={false} hideBackButton={hideBackButton} readDocument={() => readCardDocument(card, storageUserId)} saveDocument={document => saveCardDocument(card, { ...readCardDocument(card, storageUserId), ...document }, storageUserId)} onClose={onClose} onSave={onSave} backLabel="카드 목록으로 돌아가기" titleLabel="카드 제목" /></div><CardDetails card={card} onSave={onSave} /></div>
}
