"use client"

import { useSyncExternalStore } from 'react'
import { ChevronRight, FileText, Folder } from 'lucide-react'
import { MarkdownDocument } from '@/components/markdown-document'
import { readWorkspaceDocument, saveWorkspaceDocument, WORKSPACE_DOCUMENT_CHANGE_EVENT } from '@/lib/workspace-document'
import type { SavedCardDocument } from '@/lib/card-document'

interface CommonDocument {
  name: string
  category: string
}

const COMMON_DOCUMENTS: CommonDocument[] = [
  { name: '0720 회의록.md', category: '회의록' },
  { name: '커밋 컨벤션.md', category: '공통' },
]

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(WORKSPACE_DOCUMENT_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(WORKSPACE_DOCUMENT_CHANGE_EVENT, onChange)
  }
}

interface CommonPageProps {
  projectId: string
  document: string | null
  onOpenDocument: (name: string) => void
  onBack: () => void
}

/** 프로젝트별 공통 문서 목록과 카드와 동일한 Markdown 편집·미리보기를 제공한다. */
export function CommonPage({ projectId, document, onOpenDocument, onBack }: CommonPageProps) {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(COMMON_DOCUMENTS.map(item => readWorkspaceDocument(projectId, item.name))), () => JSON.stringify(COMMON_DOCUMENTS.map(() => null)))
  const savedDocuments = JSON.parse(snapshot) as (SavedCardDocument | null)[]
  if (document) {
    return <MarkdownDocument key={`${projectId}:${document}`} initialDocument={{ title: document.replace(/\.md$/i, ''), content: '' }} readDocument={() => readWorkspaceDocument(projectId, document)} saveDocument={value => saveWorkspaceDocument(projectId, document, value)} onClose={onBack} backLabel="공통 문서 목록" titleLabel="문서 제목" />
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE / COMMON</div><h2 className="project-overview-title">Common</h2><p>회의록과 공통 문서를 한곳에서 확인하세요.</p></div></div>
    <section className="common-documents" aria-labelledby="common-documents-heading">
      <div className="section-heading"><h2 id="common-documents-heading"><Folder size={17} />공통 문서</h2><span className="count-badge">{COMMON_DOCUMENTS.length}</span></div>
      <ul className="common-list">
        {COMMON_DOCUMENTS.map((item, index) => <li key={item.name}>
          <button className="common-document" onClick={() => onOpenDocument(item.name)}>
            <span className="document-icon"><FileText size={19} /></span>
            <span className="document-label"><strong>{savedDocuments[index] ? `${savedDocuments[index].title.replace(/\.md$/i, '')}.md` : item.name}</strong><small>{item.category}</small></span>
            <ChevronRight size={16} />
          </button>
        </li>)}
      </ul>
    </section>
  </>
}
