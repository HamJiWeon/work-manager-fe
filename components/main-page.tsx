"use client"

import {useEffect, useRef, useState} from 'react'
import type {KeyboardEvent as ReactKeyboardEvent} from 'react'
import {Activity, Check, Folder, LayoutDashboard, PanelLeft, SquareKanban, X} from 'lucide-react'
import {ALL_PROJECTS, PROJECTS, createSampleTasks, getSampleCompletedCard, getMillisecondsUntilNextSeoulDay, getYearDays, getToday, type CompletedTask} from '@/lib/activity'
import {ActivityCalendar} from './activity-calendar'
import {WorkspacePage} from './workspace-page'
import {ProjectList} from './project-list'
import {CardPage} from './card-page'
import {BoardList} from './board-list'
import {SAMPLE_BOARD_ITEMS, type BoardItem} from '@/lib/board'
import type {CardItem} from '@/lib/card'
import {CardDocument} from './card-document'
import {useCardMotion} from '@/hooks/use-card-motion'

interface WorkspaceTab {
    id: string
    label: string
    section: 'overview' | 'projects' | 'project' | 'common'
    projectId: string
    board: BoardItem | null
    document: string | null
    card?: CardItem
}

const HOME_TAB: WorkspaceTab = { id: 'overview', label: '작업 현황', section: 'overview', projectId: ALL_PROJECTS, board: null, document: null }

const FOCUSABLE_ELEMENT_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

const getFocusableElements = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR))
    .filter(element => (!element.closest('details:not([open])') || element.matches('details:not([open]) > summary:first-of-type')) && !element.closest('[hidden]'))

function reorderTabs(tabs: WorkspaceTab[], sourceId: string, targetId: string, after: boolean): WorkspaceTab[] {
    if (sourceId === targetId) return tabs
    const source = tabs.find(tab => tab.id === sourceId)
    if (!source || !tabs.some(tab => tab.id === targetId)) return tabs
    const remaining = tabs.filter(tab => tab.id !== sourceId)
    const position = remaining.findIndex(tab => tab.id === targetId) + Number(after)
    return [...remaining.slice(0, position), source, ...remaining.slice(position)]
}

/** 프로젝트 탐색과 활동 조회를 제공한다. 데이터는 API 연결 전의 예시다. */
export function MainPage({today: initialToday}: { today: string }) {
    const [tabs, setTabs] = useState<WorkspaceTab[]>([HOME_TAB])
    const tabList = useRef<HTMLDivElement>(null)
    const [activeTabId, setActiveTabId] = useState(HOME_TAB.id)
    const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
    const [tabDropTarget, setTabDropTarget] = useState<{ id: string; after: boolean } | null>(null)
    const previewTabs = draggedTabId && tabDropTarget ? reorderTabs(tabs, draggedTabId, tabDropTarget.id, tabDropTarget.after) : tabs
    const { handleCapturePositions } = useCardMotion(tabList, tabs, null, tabDropTarget, 'data-tab-id')
    const [projectId, setProjectId] = useState(ALL_PROJECTS)
    const [projectBoards, setProjectBoards] = useState<Record<string, BoardItem[]>>({})
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const mobileMenuButton = useRef<HTMLButtonElement>(null)
    const sidebar = useRef<HTMLElement>(null)
    const tabButtons = useRef<Record<string, HTMLButtonElement | null>>({})
    const [today, setToday] = useState(initialToday)
    const [selectedDate, setSelectedDate] = useState<string | null>(initialToday)
    const [section, setSection] = useState<'overview' | 'projects' | 'project' | 'common'>('overview')
    const [selectedBoard, setSelectedBoard] = useState<BoardItem | null>(null)
    const [document, setDocument] = useState<string | null>(null)
    const [year, setYear] = useState(Number(initialToday.slice(0, 4)))
    const days = getYearDays(year)
    const tasks = createSampleTasks(days.filter(day => day.date <= today)).filter(task => projectId === ALL_PROJECTS || task.projectId === projectId)
    const counts = new Map<string, number>()
    tasks.forEach(task => counts.set(task.date, (counts.get(task.date) ?? 0) + 1))
    const selectedTasks = tasks.filter(task => task.date === selectedDate)
    const selectedProject = PROJECTS.find(project => project.id === projectId)
    const activeCard = tabs.find(tab => tab.id === activeTabId)?.card
    const isProjectPage = section === 'project' || section === 'common'
    useEffect(() => {
        if (mobileMenuOpen && sidebar.current) getFocusableElements(sidebar.current)[0]?.focus()
    }, [mobileMenuOpen])
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const nextToday = getToday()
            setSelectedDate(currentDate => currentDate === today ? nextToday : currentDate)
            setYear(currentYear => currentYear === Number(today.slice(0, 4)) ? Number(nextToday.slice(0, 4)) : currentYear)
            setToday(nextToday)
        }, getMillisecondsUntilNextSeoulDay() + 1_000)
        return () => window.clearTimeout(timer)
    }, [today])
    const handleMobileMenuClose = () => {
        setMobileMenuOpen(false)
        if (mobileMenuOpen) mobileMenuButton.current?.focus()
    }
    const handleWorkspaceKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!mobileMenuOpen) return
        if (event.key === 'Escape') {
            handleMobileMenuClose()
            return
        }
        if (event.key !== 'Tab' || !sidebar.current) return

        const focusableElements = getFocusableElements(sidebar.current)
        const firstElement = focusableElements[0]
        const lastElement = focusableElements.at(-1)
        if (!firstElement || !lastElement) return
        const activeElement = sidebar.current.ownerDocument.activeElement

        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
        } else if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
        } else if (!sidebar.current.contains(activeElement)) {
            event.preventDefault()
            firstElement.focus()
        }
    }
    const handleActivateTab = (tab: WorkspaceTab) => {
        handleMobileMenuClose()
        setActiveTabId(tab.id)
        setProjectId(tab.projectId)
        setSection(tab.section)
        setSelectedBoard(tab.board)
        setDocument(tab.document)
    }
    const handleOpenTab = (tab: WorkspaceTab) => {
        setTabs(current => current.some(item => item.id === tab.id) ? current : [...current, tab])
        handleActivateTab(tab)
    }
    const handleCloseTab = (tabId: string) => {
        const remaining = tabs.filter(tab => tab.id !== tabId)
        setTabs(remaining)
        const index = tabs.findIndex(tab => tab.id === tabId)
        const next = remaining[Math.min(index, remaining.length - 1)] ?? HOME_TAB
        if (activeTabId === tabId) handleActivateTab(next)
        tabButtons.current[activeTabId === tabId ? next.id : activeTabId]?.focus()
    }
    const handleTabReorder = (sourceId: string, targetId: string, after: boolean) => {
        handleCapturePositions()
        setTabs(current => reorderTabs(current, sourceId, targetId, after))
    }
    const handleTabDragEnd = () => {
        handleCapturePositions()
        setDraggedTabId(null)
        setTabDropTarget(null)
    }
    const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, tab: WorkspaceTab) => {
        const index = tabs.findIndex(item => item.id === tab.id)
        if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault()
            const after = event.key === 'ArrowRight'
            const target = tabs[index + (after ? 1 : -1)]
            if (target) handleTabReorder(tab.id, target.id, after)
            return
        }
        let nextIndex: number
        switch (event.key) {
            case 'ArrowRight': nextIndex = (index + 1) % tabs.length; break
            case 'ArrowLeft': nextIndex = (index - 1 + tabs.length) % tabs.length; break
            case 'Home': nextIndex = 0; break
            case 'End': nextIndex = tabs.length - 1; break
            case 'Delete':
                if (tab.id !== HOME_TAB.id) { event.preventDefault(); handleCloseTab(tab.id) }
                return
            default: return
        }
        event.preventDefault()
        const next = tabs[nextIndex]
        handleActivateTab(next)
        tabButtons.current[next.id]?.focus()
    }
    const handleProjectOpen = (id: string) => {
        handleOpenTab({ id: `project:${id}`, label: PROJECTS.find(project => project.id === id)?.name ?? id, section: 'project', projectId: id, board: null, document: null })
    }
    const handleProjectChange = (value: string) => {
        handleOpenTab({ ...HOME_TAB, id: value === ALL_PROJECTS ? HOME_TAB.id : `overview:${value}`, label: value === ALL_PROJECTS ? HOME_TAB.label : `${PROJECTS.find(project => project.id === value)?.name} 작업 현황`, projectId: value })
    }
    const handleYearChange = (value: number) => {
        setYear(value)
        setSelectedDate(null)
    }
    const handleProjectsOpen = () => {
        handleOpenTab({ id: 'projects', label: '프로젝트 리스트', section: 'projects', projectId: ALL_PROJECTS, board: null, document: null })
    }
    const handleBoardOpen = (board: BoardItem, boardProjectId = projectId) => {
        handleOpenTab({ id: `board:${boardProjectId}:${board.id}`, label: board.name, section: 'project', projectId: boardProjectId, board, document: null })
    }
    const handleBoardCreate = (board: BoardItem) => {
        setProjectBoards(current => ({ ...current, [projectId]: [...(current[projectId] ?? SAMPLE_BOARD_ITEMS), board] }))
    }
    const handleCompletedTaskOpen = (task: CompletedTask) => {
        const card = getSampleCompletedCard(task)
        const board = SAMPLE_BOARD_ITEMS.find(item => item.id === 'login') ?? null
        handleOpenTab({ id: `card:${card.boardId}:${card.id}`, label: card.title, section: 'project', projectId: task.projectId, board, document: null, card })
    }
    const handleCommonOpen = () => {
        handleOpenTab({ id: `common:${projectId}`, label: `${selectedProject?.name} Workspace`, section: 'common', projectId, board: null, document: null })
    }
    const handleDocumentOpen = (name: string) => {
        handleOpenTab({ id: `document:${projectId}:${name}`, label: name, section: 'common', projectId, board: null, document: name })
    }

    return <div className={`workspace ${sidebarOpen ? '' : 'sidebar-hidden'} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`} onKeyDown={handleWorkspaceKeyDown}>
        <button className="sidebar-backdrop" aria-label="모바일 메뉴 닫기" aria-hidden={!mobileMenuOpen}
                tabIndex={mobileMenuOpen ? 0 : -1} onClick={handleMobileMenuClose}/>
        <aside ref={sidebar} id="workspace-sidebar" className="sidebar" aria-label="워크스페이스 탐색">
            <button className="brand" onClick={() => handleProjectChange(ALL_PROJECTS)}><span className="brand-mark">w.</span> Work Manager</button>
            <div className="workspace-label">SPACE</div>
            <button className={`nav-item ${projectId === ALL_PROJECTS && section === 'overview' ? 'active' : ''}`}
                    onClick={() => handleProjectChange(ALL_PROJECTS)}><LayoutDashboard size={16}/>작업 현황
            </button>
            <section className="nav-section">
                <h2><button className={`project-nav ${section === 'projects' ? 'active' : ''}`}
                            onClick={handleProjectsOpen}
                            aria-current={section === 'projects' ? 'page' : undefined}>PROJECT <span>{PROJECTS.length}</span>
                </button></h2>
                {PROJECTS.map(project => <details open key={project.id}>
                    <summary><Folder size={15}/><span>{project.name}</span></summary>
                    {(projectBoards[project.id] ?? SAMPLE_BOARD_ITEMS).map(board => <button key={board.id}
                        className={`nav-item board-link ${projectId === project.id && selectedBoard?.id === board.id && section === 'project' ? 'active' : ''}`}
                        aria-label={`${project.name} ${board.name} 보드`}
                        onClick={() => handleBoardOpen(board, project.id)}><SquareKanban size={15}/>{board.name}</button>)}
                </details>)}
            </section>

            <div className="sidebar-footer"><span className="avatar">M</span>
                <div>나의 워크스페이스<small>Personal workspace</small></div>
            </div>
        </aside>
        <div className="main-shell">
            <header className="topbar">
                <button className="icon-button desktop-sidebar-toggle" aria-label={sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
                        aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft size={18}/>
                </button>
                <button ref={mobileMenuButton} className="icon-button mobile-sidebar-toggle" aria-label={mobileMenuOpen ? '모바일 메뉴 접기' : '모바일 메뉴 열기'} aria-expanded={mobileMenuOpen} aria-controls="workspace-sidebar" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><PanelLeft size={18}/></button>
                <span className="topbar-divider"/>
                <div ref={tabList} className="workspace-tabs" role="tablist" aria-label="열린 화면">
                    {previewTabs.map(tab => <div data-tab-id={tab.id} className={`workspace-tab ${activeTabId === tab.id ? 'active' : ''} ${draggedTabId === tab.id ? 'tab-drag-placeholder' : ''}`} key={tab.id}
                        onDragOver={event => {
                            if (!draggedTabId) return
                            event.preventDefault()
                            event.dataTransfer.dropEffect = 'move'
                            if (draggedTabId === tab.id) return
                            const bounds = event.currentTarget.getBoundingClientRect()
                            const after = event.clientX > bounds.left + bounds.width / 2
                            if (tabDropTarget?.id === tab.id && tabDropTarget.after === after) return
                            handleCapturePositions()
                            setTabDropTarget({ id: tab.id, after })
                        }}
                        onDrop={event => {
                            event.preventDefault()
                            if (draggedTabId && tabDropTarget) handleTabReorder(draggedTabId, tabDropTarget.id, tabDropTarget.after)
                            handleTabDragEnd()
                        }}>
                        <button draggable onDragStart={event => { setDraggedTabId(tab.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', tab.id) }} onDragEnd={handleTabDragEnd} aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight" ref={element => { tabButtons.current[tab.id] = element }} id={`tab-${encodeURIComponent(tab.id)}`} role="tab" tabIndex={activeTabId === tab.id ? 0 : -1} aria-selected={activeTabId === tab.id} aria-controls="workspace-panel" onKeyDown={event => handleTabKeyDown(event, tab)} onClick={() => handleActivateTab(tab)}><Folder size={15} aria-hidden="true" />{tab.label}</button>
                        {tab.id !== HOME_TAB.id && <button tabIndex={-1} className="workspace-tab-close" aria-label={`${tab.label} 탭 닫기`} onClick={() => handleCloseTab(tab.id)}><X size={13} aria-hidden="true" /></button>}
                    </div>)}
                </div>
            </header>
            <main id="workspace-panel" role="tabpanel" aria-labelledby={`tab-${encodeURIComponent(activeTabId)}`} className={isProjectPage ? 'project-detail-page' : undefined}>
                {isProjectPage && <div className="project-context"><h1>{selectedProject?.name}</h1></div>}
                {isProjectPage && !document && !activeCard && <nav className="list-switcher" aria-label="프로젝트 메뉴 선택">
                    <button aria-current={section === 'project' ? 'page' : undefined}
                            onClick={() => handleProjectOpen(projectId)}>BOARD
                    </button>
                    <button aria-current={section === 'common' ? 'page' : undefined} onClick={handleCommonOpen}>WORKSPACE
                    </button>
                </nav>}
                {tabs.filter(tab => tab.board && !tab.card).map(tab => <div key={tab.id} hidden={activeTabId !== tab.id}>
                    <CardPage boardId={`${tab.projectId}-${tab.board!.id}`} boardName={tab.board!.name}
                        onOpenCard={card => handleOpenTab({ id: `card:${card.boardId}:${card.id}`, label: card.title, section: 'project', projectId: tab.projectId, board: tab.board, document: null, card })}/>
                </div>)}
                {tabs.filter(tab => tab.card || tab.document).map(tab => <div key={tab.id} hidden={activeTabId !== tab.id}>
                    {tab.card ? <CardDocument card={tab.card} hideBackButton onClose={() => {}} onSave={saved => setTabs(current => current.map(item => item.id === tab.id && item.card ? { ...item, label: saved.title, card: { ...item.card, ...saved } } : item))}/> :
                        <WorkspacePage projectId={tab.projectId} document={tab.document} onOpenDocument={handleDocumentOpen} onBack={handleCommonOpen} onSave={saved => setTabs(current => current.map(item => item.id === tab.id ? { ...item, label: `${saved.title.replace(/\.md$/i, '')}.md` } : item))}/>}
                </div>)}
                {activeCard || document ? null : section === 'projects' ? <ProjectList onOpenProject={handleProjectOpen}/> : section === 'common' ?
                    <WorkspacePage projectId={projectId} document={null} onOpenDocument={handleDocumentOpen} onBack={handleCommonOpen}/> : section === 'project' ? <>{selectedBoard ? null : <BoardList key={projectId} boards={projectBoards[projectId] ?? SAMPLE_BOARD_ITEMS} onCreateBoard={handleBoardCreate} onOpenBoard={board => handleBoardOpen(board)}/>}</> : <>
                        <section className="activity-section" aria-labelledby="activity-heading">
                            <div className="section-heading activity-heading"><h2 id="activity-heading"><Activity size={18}/>작업 활동</h2>
</div>
                            <ActivityCalendar days={days} year={year} today={today} counts={counts}
                                              selectedDate={selectedDate} onSelectDate={setSelectedDate}
                                              onYearChange={handleYearChange} projectFilter={<label className="project-filter"><span className="sr-only">프로젝트 선택</span><Folder
                                size={15}/><select value={projectId}
                                                   onChange={event => handleProjectChange(event.target.value)}>
                                <option value={ALL_PROJECTS}>전체 프로젝트</option>
                                {PROJECTS.map(project => <option value={project.id}
                                                                 key={project.id}>{project.name}</option>)}
                            </select></label>}/></section>
                        <section className="details-section activity-details" aria-live="polite">
                            <div className="section-heading">
                                <h2>{selectedDate ? `${selectedDate.replaceAll('-', '.')} 완료한 작업` : '날짜별 작업'}</h2>{selectedDate &&
                                <span className="count-badge">{selectedTasks.length}</span>}</div>
                            {!selectedDate ?
                                <div className="empty-state"><span className="empty-icon"><Check size={21}/></span>
                                    <h3>어떤 작업을 완료했나요?</h3><p>캘린더에서 날짜를 선택하면 완료한 작업을 볼 수 있어요.</p>
                                </div> : selectedTasks.length === 0 ?
                                    <div className="empty-state"><h3>완료한 작업이 없는 날이에요</h3><p>다른 날짜를 선택해 작업 기록을 확인해
                                        보세요.</p></div> :
                                    <ul className="task-list">{selectedTasks.map(task => <li key={task.id}><button className="completed-task-open" aria-label={`${task.title} 카드 열기`} onClick={() => handleCompletedTaskOpen(task)}><Check
                                        size={16}/><span>{task.title}</span><small>{PROJECTS.find(project => project.id === task.projectId)?.name} / {(projectBoards[task.projectId] ?? SAMPLE_BOARD_ITEMS).find(board => `${task.projectId}-${board.id}` === getSampleCompletedCard(task).boardId)?.name}</small></button></li>)}</ul>}</section>
                    </>}
            </main>
            <footer className="page-footer">Work Manager<span>매일의 작업, 차곡차곡.</span></footer>
        </div>
    </div>
}
