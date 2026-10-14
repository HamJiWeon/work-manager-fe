import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CardPage } from '@/components/card-page'

beforeEach(() => localStorage.clear())

describe('card_create', () => {
  it('create_only_in_not_started_restore_and_preview_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<CardPage boardId="create-board" />)
    await screen.findByRole('button', { name: 'Team 카드 열기' })
    // then
    expect(screen.queryByRole('button', { name: '진행 중 카드 추가' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '완료 카드 추가' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    expect(screen.getByRole('dialog', { name: '카드 추가' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '새 작업')
    await user.type(screen.getByRole('textbox', { name: '내용' }), '새 작업의 상세 내용')
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    const card = within(screen.getByRole('region', { name: '시작 전 카드 목록' })).getByRole('button', { name: '새 작업 카드 열기' })
    expect(within(card).getByLabelText('카드 코드')).toHaveTextContent('PJT-73')
    // when
    view.unmount()
    render(<CardPage boardId="create-board" />)
    await user.click(await screen.findByRole('button', { name: '새 작업 카드 열기' }))
    // then
    expect(screen.getByRole('heading', { name: '새 작업', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('새 작업의 상세 내용')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Markdown 작성' })).not.toBeInTheDocument()
  })

  it('expand_collapse_preserves_draft_and_saves_markdown_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="expanded-board" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '확대 작성')
    await user.type(screen.getByRole('textbox', { name: '내용' }), '상세 내용')
    // when
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    // then
    expect(screen.getByRole('region', { name: '새 카드 작성' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: '카드 세부 사항' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveValue('확대 작성')
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('상세 내용')
    expect(screen.getByRole('toolbar', { name: 'Markdown 서식' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '카드 추가 창 축소' }))
    // then
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('상세 내용')
    // when
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '담당자' }), '김민수')
    await user.type(screen.getByLabelText('시작일'), '2026-10-14')
    await user.type(screen.getByLabelText('종료일'), '2026-10-15')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await user.click(await screen.findByRole('button', { name: '확대 작성 카드 열기' }))
    // then
    expect(screen.getByRole('heading', { name: '확대 작성', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('상세 내용')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '담당자 변경' })).toHaveTextContent('김민수')
    expect(screen.getByRole('button', { name: '시작일 변경' })).toHaveTextContent('2026-10-14')
    expect(screen.getByRole('button', { name: '종료일 변경' })).toHaveTextContent('2026-10-15')
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
    await user.type(screen.getByRole('textbox', { name: '내용' }), '작성 중 내용')
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('카드를 저장하지 못했습니다.')
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveValue('초안')
    expect(screen.queryByRole('button', { name: '초안 카드 열기' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('작성 중 내용')
    storage.mockRestore()
    // when
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.queryByRole('textbox', { name: '시작 전 새 카드 제목' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '시작 전 카드 추가' })).toHaveFocus()
  })
})
