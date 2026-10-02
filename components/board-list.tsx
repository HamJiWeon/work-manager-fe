import { List, FileText } from 'lucide-react'
import { SAMPLE_BOARD_ITEMS } from '@/lib/board'

interface BoardListProps {
  projectId: string
}

/** 프로젝트 보드의 화면 초안을 더미 작업 목록으로 표시한다. */
export function BoardList({ projectId }: BoardListProps) {
  return <>
    <div className="page-heading"><div><div className="eyebrow">PROJECT / BOARD</div><h2 className="project-overview-title">보드{projectId.slice(-1)}</h2><p>프로젝트에서 진행할 작업을 확인하세요.</p></div></div>
    <section className="common-documents" aria-labelledby="board-list-heading">
      <div className="section-heading"><h2 id="board-list-heading"><List size={18} />작업 리스트</h2><span className="count-badge">{SAMPLE_BOARD_ITEMS.length}</span><span className="sample-badge">예시 데이터</span></div>
      <ul className="board-list">{SAMPLE_BOARD_ITEMS.map(item => <li key={item.id}>
        <span className="document-icon"><FileText size={19} /></span>
        <div className="board-item-content"><h3>{item.name}</h3><p>{item.description}</p></div>
        <span className={`board-status ${item.status === '완료' ? 'done' : item.status === '진행 중' ? 'in-progress' : 'todo'}`}>{item.status}</span>
      </li>)}</ul>
    </section>
  </>
}
