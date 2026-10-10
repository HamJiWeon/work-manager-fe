"use client"

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Hash, Search, SlidersHorizontal, Users, X } from 'lucide-react'

const CARD_CODE_PREFIX = 'PJT-'
const SAMPLE_MEMBERS = ['김민수', '이서연', '박지훈'] as const
const FILTER_FIELDS = [
  { id: 'members', label: '담당 멤버', icon: Users },
  { id: 'period', label: '기간', icon: CalendarDays },
  { id: 'code', label: '코드', icon: Hash },
] as const

type FilterField = typeof FILTER_FIELDS[number]['id']

/** 조건별로 전환하는 필터 패널 시안을 표시한다. 선택 조건은 유지되며 카드 조회는 아직 연동하지 않는다. */
export function CardFilters() {
  const [visible, setVisible] = useState(false)
  const [field, setField] = useState<FilterField>('members')
  const [members, setMembers] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [code, setCode] = useState('')
  const root = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const counts = { members: members.length, period: Number(Boolean(fromDate || toDate)), code: Number(Boolean(code)) }
  const conditionCount = Object.values(counts).filter(Boolean).length
  const visibleMembers = SAMPLE_MEMBERS.filter(name => name.includes(memberSearch.trim()))
  useEffect(() => {
    if (!visible) return
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setVisible(false)
    }
    document.addEventListener('pointerdown', handleOutsideClick)
    return () => document.removeEventListener('pointerdown', handleOutsideClick)
  }, [visible])
  const handleClearField = () => {
    if (field === 'members') setMembers([])
    if (field === 'period') { setFromDate(''); setToDate('') }
    if (field === 'code') setCode('')
  }
  const handleReset = () => {
    setMembers([])
    setFromDate('')
    setToDate('')
    setCode('')
    setMemberSearch('')
  }
  return <section ref={root} className="card-filter-popover" aria-label="카드 필터 예시" onKeyDown={event => {
    if (event.key === 'Escape') { setVisible(false); toggle.current?.focus() }
  }}>
    <div className="filter-button-row">
      <button ref={toggle} className="filter-trigger" type="button" aria-label="필터" aria-expanded={visible} aria-controls="card-filter-body" onClick={() => setVisible(current => !current)}><SlidersHorizontal size={17} aria-hidden="true" />필터{conditionCount > 0 && <span className="filter-number">{conditionCount}</span>}</button>
      <button className="filter-reset" type="button" onClick={handleReset} disabled={!conditionCount}>필터 지우기</button>
      <span className="filter-example-label">디자인 예시</span>
    </div>
    {visible && <div id="card-filter-body" className="filter-panel">
      <div className="filter-panel-main">
        <div className="filter-field-nav"><div role="tablist" aria-label="필터 조건">{FILTER_FIELDS.map(({ id, label, icon: Icon }) => <button key={id} id={`filter-tab-${id}`} role="tab" aria-selected={field === id} aria-controls={`filter-content-${id}`} onClick={() => setField(id)}><Icon size={16} aria-hidden="true" />{label}{counts[id] > 0 && <span className="filter-number">{counts[id]}</span>}</button>)}</div><button className="filter-clear-link" onClick={handleReset}>모두 지우기</button></div>
        <div className="filter-condition" role="tabpanel" id={`filter-content-${field}`} aria-labelledby={`filter-tab-${field}`}>
          <div className="filter-condition-body">
            {field === 'members' && <><label className="filter-search"><Search size={18} aria-hidden="true" /><input type="search" aria-label="담당 멤버 검색" placeholder="담당 멤버 검색" value={memberSearch} onChange={event => setMemberSearch(event.target.value)} /></label><div className="filter-members">{visibleMembers.map((name, index) => <label key={name} className={members.includes(name) ? 'checked' : ''}><input type="checkbox" checked={members.includes(name)} onChange={event => setMembers(current => event.target.checked ? [...current, name] : current.filter(member => member !== name))} /><span aria-hidden="true" className={`filter-member-avatar avatar-color-${index}`}>{name.slice(0, 1)}</span><span>{name}</span></label>)}{!visibleMembers.length && <p className="filter-empty">검색 결과가 없습니다.</p>}</div></>}
            {field === 'period' && <div className="filter-period"><h3>기간 선택</h3><label><span>시작</span><input type="date" aria-label="기간 시작" value={fromDate} max={toDate || undefined} onChange={event => setFromDate(event.target.value)} /></label><label><span>종료</span><input type="date" aria-label="기간 종료" value={toDate} min={fromDate || undefined} onChange={event => setToDate(event.target.value)} /></label></div>}
            {field === 'code' && <div className="filter-code"><h3>코드 검색</h3><label className="filter-search"><Search size={18} aria-hidden="true" /><span className="filter-code-prefix" aria-hidden="true">{CARD_CODE_PREFIX}</span><input type="search" aria-label="코드" inputMode="numeric" pattern="[0-9]*" placeholder="번호 입력" value={code} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ''))} /></label></div>}
          </div>
          <div className="filter-condition-footer"><button className="filter-clear-link" onClick={handleClearField}>지우기</button>{field === 'members' && <span>{members.length}/{SAMPLE_MEMBERS.length} 선택</span>}</div>
        </div>
      </div>
      <div className="filter-panel-footer"><span>필터 UI 예시 · 카드 조회 연동 전</span><button aria-label="필터 닫기" onClick={() => { setVisible(false); toggle.current?.focus() }}><X size={15} aria-hidden="true" />닫기</button></div>
    </div>}
  </section>
}
