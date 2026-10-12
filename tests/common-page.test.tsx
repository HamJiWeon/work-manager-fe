import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommonPage } from '@/components/common-page'

function CommonWorkspace({ projectId = 'project-1' }: { projectId?: string }) {
  const [document, setDocument] = useState<string | null>(null)
  return <CommonPage projectId={projectId} document={document} onOpenDocument={setDocument} onBack={() => setDocument(null)} />
}

beforeEach(() => localStorage.clear())

describe('workspace_markdown', () => {
  it('edit_title_shortcut_save_preview_and_restore_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<CommonWorkspace />)
    await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    // when
    await user.clear(screen.getByRole('textbox', { name: '문서 제목' }))
    await user.type(screen.getByRole('textbox', { name: '문서 제목' }), '회의 정리')
    await user.click(screen.getByRole('textbox', { name: 'Markdown 작성' }))
    await user.keyboard('{Meta>}e{/Meta}')
    await user.keyboard('meeting')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('heading', { name: '회의 정리', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('meeting').tagName).toBe('CODE')
    expect(screen.queryByText('COMMON / DOCUMENTS')).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '← 공통 문서 목록' }))
    expect(screen.getByRole('button', { name: /회의 정리.md/ })).toBeInTheDocument()
    view.unmount()
    render(<CommonWorkspace />)
    await user.click(screen.getByRole('button', { name: /회의 정리.md/ }))
    // then
    expect(screen.getByRole('heading', { name: '회의 정리', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('meeting')).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.clear(screen.getByRole('textbox', { name: 'Markdown 작성' }))
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.getByText('meeting')).toBeInTheDocument()
  })

  it('documents_and_projects_are_isolated_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<CommonWorkspace />)
    await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '첫 프로젝트 문서')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // when
    await user.click(screen.getByRole('button', { name: '← 공통 문서 목록' }))
    await user.click(screen.getByRole('button', { name: /커밋 컨벤션.md/ }))
    // then
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('')
    // when
    view.unmount()
    render(<CommonWorkspace projectId="project-2" />)
    await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    // then
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('')
  })

  it('empty_preview_and_storage_failure_ko', async () => {
    // given
    const user = userEvent.setup()
    render(<CommonWorkspace />)
    await user.click(screen.getByRole('button', { name: /0720 회의록.md/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(screen.getByText(/작성된 내용이 없습니다/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '편집' }))
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    // when
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '초안')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다')
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('초안')
    storage.mockRestore()
  })
})
