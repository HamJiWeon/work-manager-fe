import { ArrowLeft, ChevronRight, FileText, Folder } from 'lucide-react'

interface CommonDocument {
  name: string
  category: string
}

const COMMON_DOCUMENTS: CommonDocument[] = [
  { name: '0720 회의록.md', category: '회의록' },
  { name: '커밋 컨벤션.md', category: '공통' },
]

interface CommonPageProps {
  document: string | null
  onOpenDocument: (name: string) => void
  onBack: () => void
}

/** 공통 문서 목록과 선택한 문서의 빈 상세 화면을 표시한다. */
export function CommonPage({ document, onOpenDocument, onBack }: CommonPageProps) {
  if (document) {
    return <>
      <button className="common-back" onClick={onBack}><ArrowLeft size={15} />공통 문서 목록</button>
      <div className="eyebrow">COMMON / DOCUMENTS</div>
      <h2 className="project-overview-title">{document}</h2>
      <div className="document-empty"><FileText size={28} /><h2>아직 작성된 내용이 없어요</h2><p>공통 문서를 위한 공간입니다.</p></div>
    </>
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE / COMMON</div><h2 className="project-overview-title">Common</h2><p>회의록과 공통 문서를 한곳에서 확인하세요.</p></div></div>
    <section className="common-documents" aria-labelledby="common-documents-heading">
      <div className="section-heading"><h2 id="common-documents-heading"><Folder size={17} />공통 문서</h2><span className="count-badge">{COMMON_DOCUMENTS.length}</span></div>
      <ul className="common-list">
        {COMMON_DOCUMENTS.map(item => <li key={item.name}>
          <button className="common-document" onClick={() => onOpenDocument(item.name)}>
            <span className="document-icon"><FileText size={19} /></span>
            <span className="document-label"><strong>{item.name}</strong><small>{item.category}</small></span>
            <ChevronRight size={16} />
          </button>
        </li>)}
      </ul>
    </section>
  </>
}
