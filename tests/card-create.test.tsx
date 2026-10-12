import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CardPage } from '@/components/card-page'

beforeEach(() => localStorage.clear())

describe('card_create', () => {
  it('create_in_selected_status_restore_and_preview_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<CardPage boardId="create-board" />)
    await screen.findByRole('button', { name: 'Team 카드 열기' })
    // when
    await user.click(screen.getByRole('button', { name: '완료 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '완료 새 카드 제목' }), '새 작업')
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    const card = within(screen.getByRole('region', { name: '완료 카드 목록' })).getByRole('button', { name: '새 작업 카드 열기' })
    expect(within(card).getByLabelText('카드 코드')).toHaveTextContent('PJT-73')
    // when
    view.unmount()
    render(<CardPage boardId="create-board" />)
    await user.click(await screen.findByRole('button', { name: '새 작업 카드 열기' }))
    // then
    expect(screen.getByRole('heading', { name: '새 작업', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Markdown 작성' })).not.toBeInTheDocument()
  })

  it('blank_cancel_and_storage_failure_preserve_draft_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="create-board" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    // when
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해 주세요.')
    // when
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '초안')
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('카드를 저장하지 못했습니다.')
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveValue('초안')
    expect(screen.queryByRole('button', { name: '초안 카드 열기' })).not.toBeInTheDocument()
    storage.mockRestore()
    // when
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.queryByRole('textbox', { name: '시작 전 새 카드 제목' })).not.toBeInTheDocument()
  })
})
