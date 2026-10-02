"use client"

import {useEffect, useRef, useState} from 'react'
import type {KeyboardEvent as ReactKeyboardEvent} from 'react'
import {Activity, Check, ChevronRight, Folder, LayoutDashboard, PanelLeft, SquareKanban} from 'lucide-react'
import {ALL_PROJECTS, PROJECTS, createSampleTasks, getMillisecondsUntilNextSeoulDay, getMonthDays, getToday} from '@/lib/activity'
import {ActivityCalendar} from './activity-calendar'
import {CommonPage} from './common-page'
import {ProjectList} from './project-list'
import {BoardList} from './board-list'

const FOCUSABLE_ELEMENT_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

const getFocusableElements = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR))
    .filter(element => !element.closest('details:not([open])') && !element.closest('[hidden]'))

/** 프로젝트 탐색과 활동 조회를 제공한다. 데이터는 API 연결 전의 예시다. */
export function Workspace({today: initialToday}: { today: string }) {
    const [projectId, setProjectId] = useState(ALL_PROJECTS)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const mobileMenuButton = useRef<HTMLButtonElement>(null)
    const sidebar = useRef<HTMLElement>(null)
    const [today, setToday] = useState(initialToday)
    const [selectedDate, setSelectedDate] = useState<string | null>(initialToday)
    const [section, setSection] = useState<'overview' | 'projects' | 'project' | 'common'>('overview')
    const [document, setDocument] = useState<string | null>(null)
    const [month, setMonth] = useState(initialToday.slice(0, 7))
    const days = getMonthDays(month)
    const tasks = createSampleTasks(days.filter(day => day.date <= today)).filter(task => projectId === ALL_PROJECTS || task.projectId === projectId)
    const counts = new Map<string, number>()
    tasks.forEach(task => counts.set(task.date, (counts.get(task.date) ?? 0) + 1))
    const selectedTasks = tasks.filter(task => task.date === selectedDate)
    const selectedProject = PROJECTS.find(project => project.id === projectId)
    const isProjectPage = section === 'project' || section === 'common'
    useEffect(() => {
        if (mobileMenuOpen && sidebar.current) getFocusableElements(sidebar.current)[0]?.focus()
    }, [mobileMenuOpen])
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const nextToday = getToday()
            setSelectedDate(currentDate => currentDate === today ? nextToday : currentDate)
            setMonth(currentMonth => currentMonth === today.slice(0, 7) ? nextToday.slice(0, 7) : currentMonth)
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
    const handleProjectOpen = (id: string) => {
        handleMobileMenuClose()
        setProjectId(id);
        setDocument(null);
        setSection('project')
    }
    const handleProjectChange = (id: string) => {
        handleMobileMenuClose()
        setProjectId(id);
        setDocument(null);
        setSection('overview')
    }

    const handleMonthChange = (value: string) => {
        setMonth(value);
        setSelectedDate(null)
    }
    const handleProjectsOpen = () => {
        handleMobileMenuClose()
        setSection('projects');
        setDocument(null)
    }
    const handleCommonOpen = () => {
        setSection('common');
        setDocument(null)
    }
    const handleDocumentOpen = (name: string) => {
        setSection('common');
        setDocument(name)
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
                    <button
                        className={`nav-item board-link ${projectId === project.id && section === 'project' ? 'active' : ''}`}
                        onClick={() => handleProjectOpen(project.id)}><SquareKanban
                        size={15}/>보드{project.id.slice(-1)}</button>
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
                <nav className="breadcrumbs" aria-label="현재 위치">
                    <button className="breadcrumb-button" onClick={() => handleProjectChange(ALL_PROJECTS)}>워크스페이스</button>
                    <ChevronRight size={13} aria-hidden="true"/>
                    {section === 'common' ? <>
                        <button className="breadcrumb-button" onClick={handleCommonOpen} aria-current={!document ? 'page' : undefined}>Common</button>
                        {document && <><ChevronRight size={13} aria-hidden="true"/><span aria-current="page">{document.replace(/\.md$/i, '')}</span></>}
                    </> : <span aria-current="page">{section === 'projects' ? '프로젝트 리스트' : section === 'project' ? selectedProject?.name : '작업 현황'}</span>}
                </nav>
            </header>
            <main className={isProjectPage ? 'project-detail-page' : undefined}>
                {isProjectPage && <div className="project-context"><button className="common-back" onClick={handleProjectsOpen}>프로젝트 리스트로 돌아가기</button><h1>{selectedProject?.name}</h1></div>}
                {isProjectPage && !document && <nav className="list-switcher" aria-label="프로젝트 메뉴 선택">
                    <button aria-current={section === 'project' ? 'page' : undefined}
                            onClick={() => handleProjectOpen(projectId)}>PROJECT
                    </button>
                    <button aria-current={section === 'common' ? 'page' : undefined} onClick={handleCommonOpen}>WORKSPACE
                    </button>
                </nav>}
                {section === 'projects' ? <ProjectList onOpenProject={handleProjectOpen}/> : section === 'common' ?
                    <CommonPage document={document} onOpenDocument={handleDocumentOpen} onBack={handleCommonOpen}/> : section === 'project' ? <BoardList projectId={projectId}/> : <>
                        <div className="page-heading">
                            <div>
                                <div className="eyebrow">WORKSPACE OVERVIEW</div>
                                <h1>작업 현황</h1><p>하루하루 쌓이는 작업을 한눈에 확인하세요.</p></div>
                            <label className="project-filter"><span className="sr-only">프로젝트 선택</span><Folder
                                size={15}/><select value={projectId}
                                                   onChange={event => handleProjectChange(event.target.value)}>
                                <option value={ALL_PROJECTS}>전체 프로젝트</option>
                                {PROJECTS.map(project => <option value={project.id}
                                                                 key={project.id}>{project.name}</option>)}
                            </select></label></div>
                        <section className="activity-section" aria-labelledby="activity-heading">
                            <div className="section-heading"><h2 id="activity-heading"><Activity size={18}/>작업 활동</h2>
                                <span className="sample-badge">예시 데이터</span></div>
                            <ActivityCalendar days={days} month={month} today={today} counts={counts}
                                              selectedDate={selectedDate} onSelectDate={setSelectedDate}
                                              onMonthChange={handleMonthChange}/></section>
                        <section className="details-section" aria-live="polite">
                            <div className="section-heading">
                                <h2>{selectedDate ? `${selectedDate.replaceAll('-', '.')} 완료한 작업` : '날짜별 작업'}</h2>{selectedDate &&
                                <span className="count-badge">{selectedTasks.length}</span>}</div>
                            {!selectedDate ?
                                <div className="empty-state"><span className="empty-icon"><Check size={21}/></span>
                                    <h3>어떤 작업을 완료했나요?</h3><p>캘린더에서 날짜를 선택하면 완료한 작업을 볼 수 있어요.</p>
                                </div> : selectedTasks.length === 0 ?
                                    <div className="empty-state"><h3>완료한 작업이 없는 날이에요</h3><p>다른 날짜를 선택해 작업 기록을 확인해
                                        보세요.</p></div> :
                                    <ul className="task-list">{selectedTasks.map(task => <li key={task.id}><Check
                                        size={16}/><span>{task.title}</span><small>{PROJECTS.find(project => project.id === task.projectId)?.name}</small><span
                                        className="done-badge">완료</span></li>)}</ul>}</section>
                    </>}
            </main>
            <footer className="page-footer">Work Manager<span>매일의 작업, 차곡차곡.</span></footer>
        </div>
    </div>
}
