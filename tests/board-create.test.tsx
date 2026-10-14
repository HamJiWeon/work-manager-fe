import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MainPage } from '@/components/main-page'

describe('board_create', () => {
  it('create_board_in_project_and_open_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today="2026-10-12" />)
    await user.click(screen.getByRole('button', { name: 'PROJECT 2' }))
    await user.click(screen.getByRole('button', { name: /프로젝트1.*작업 현황 보기/ }))
    // when
    await user.click(screen.getByRole('button', { name: '보드 추가' }))
    const dialog = screen.getByRole('dialog', { name: '보드 추가' })
    await user.type(within(dialog).getByRole('textbox', { name: /Title/ }), '새 보드')
    await user.type(within(dialog).getByRole('textbox', { name: 'Description' }), '새 보드 설명')
    await user.click(within(dialog).getByRole('button', { name: '생성' }))
    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const list = screen.getByRole('region', { name: '보드' })
    expect(within(list).getByText('새 보드 설명')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '프로젝트1 새 보드 보드' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '프로젝트2 새 보드 보드' })).not.toBeInTheDocument()
    // when
    await user.click(within(list).getByRole('button', { name: /새 보드/ }))
    // then
    expect(screen.getByRole('tab', { name: '새 보드' })).toHaveAttribute('aria-selected', 'true')
  })

  it('blank_title_cancel_escape_and_reset_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<MainPage today="2026-10-12" />)
    await user.click(screen.getByRole('button', { name: 'PROJECT 2' }))
    await user.click(screen.getByRole('button', { name: /프로젝트1.*작업 현황 보기/ }))
    await user.click(screen.getByRole('button', { name: '보드 추가' }))
    // when
    await user.type(screen.getByRole('textbox', { name: /Title/ }), '   ')
    await user.click(screen.getByRole('button', { name: '생성' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해 주세요.')
    // when
    await user.type(screen.getByRole('textbox', { name: /Title/ }), '취소할 보드')
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /취소할 보드/ })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '보드 추가' }))
    // then
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('')
    // when
    await user.keyboard('{Escape}')
    // then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보드 추가' })).toHaveFocus()
  })
})
