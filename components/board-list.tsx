import { Folder, FileText } from 'lucide-react'
import type { BoardItem } from '@/lib/board'
import { BoardCreateDialog } from './board-create-dialog'

interface BoardListProps {
  boards: BoardItem[]
  onCreateBoard: (board: BoardItem) => void
  onOpenBoard: (board: BoardItem) => void
}

const COMPLETED_PROGRESS = 100

/** 완료 보드를 기존 순서를 유지해 하단에 표시하고 보드 생성과 탐색을 제공한다. */
export function BoardList({ boards, onCreateBoard, onOpenBoard }: BoardListProps) {
  const orderedBoards = [
    ...boards.filter(board => board.progress < COMPLETED_PROGRESS),
    ...boards.filter(board => board.progress >= COMPLETED_PROGRESS),
  ]
  return <>
    <section className="common-documents" aria-labelledby="board-list-heading">
      <div className="section-heading"><h2 id="board-list-heading"><Folder size={18} />보드</h2><span className="count-badge">{boards.length}</span><BoardCreateDialog onCreateBoard={onCreateBoard} /></div>
      <ul className="board-list">{orderedBoards.map(item => <li key={item.id} className={item.progress >= COMPLETED_PROGRESS ? 'board-completed' : undefined}><button className="board-open" onClick={() => onOpenBoard(item)}>
        <span className="document-icon"><FileText size={19} /></span>
        <div className="board-item-content"><h3>{item.name}</h3><p>{item.description}</p></div>
        <span className="board-progress">
          <progress className="board-progress-bar" aria-label={`${item.name} 진행률`} value={item.progress} max={100}>{item.progress}%</progress>
          <strong className="board-progress-value">{item.progress}%</strong>
        </span>
      </button></li>)}</ul>
    </section>
  </>
}
