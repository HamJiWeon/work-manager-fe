
import { ChevronRight, Folder } from 'lucide-react'
import { PROJECTS } from '@/lib/activity'

interface ProjectListProps {
  onOpenProject: (id: string) => void
}

/** 프로젝트 목록에서 선택한 프로젝트의 작업 현황으로 이동한다. */
export function ProjectList({ onOpenProject }: ProjectListProps) {
  return <>
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE / PROJECT</div><h1>Project</h1><p>프로젝트를 선택해 작업 현황을 확인하세요.</p></div></div>
    <section className="common-documents" aria-labelledby="project-list-heading">
      <div className="section-heading"><h2 id="project-list-heading"><Folder size={17} />프로젝트 목록</h2><span className="count-badge">{PROJECTS.length}</span></div>
      <ul className="common-list">{PROJECTS.map(project => <li key={project.id}>
        <button className="common-document" onClick={() => onOpenProject(project.id)}>
          <span className="document-icon"><Folder size={19} /></span>
          <span className="document-label"><strong>{project.name}</strong><small>작업 현황 보기</small></span>
          <ChevronRight size={16} />
        </button>
      </li>)}</ul>
    </section>
  </>
}
