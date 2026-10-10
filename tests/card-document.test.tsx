import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CardPage } from '@/components/card-page'
import { CardDocument } from '@/components/card-document'
import type { CardItem } from '@/lib/card'

const CARD: CardItem = { id: 'one', boardId: 'board', cardNumber: 1, memberName: '김민수', projectCode: 'PJT', title: 'Team', content: '', status: 'NOT_STARTED' }
beforeEach(() => localStorage.clear())

describe('card_markdown', () => {
  it('save_assignee_dates_and_preserve_after_body_edit_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<CardDocument card={CARD} onClose={vi.fn()} />)
    const panel = screen.getByRole('complementary', { name: '카드 세부 사항' })
    // when
    await user.click(within(panel).getByRole('button', { name: '담당자 변경' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '담당자' }), '이서연')
    await user.click(screen.getByRole('button', { name: '시작일 변경' }))
    await user.type(screen.getByLabelText('시작일'), '2026-10-10')
    await user.click(screen.getByRole('button', { name: '종료일 변경' }))
    await user.type(screen.getByLabelText('종료일'), '2026-10-12')
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '본문')
    await user.click(screen.getByRole('button', { name: '저장' }))
    view.unmount()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    // then
    const restored = screen.getByRole('complementary', { name: '카드 세부 사항' })
    expect(within(restored).getByText('이서연')).toBeInTheDocument()
    expect(within(restored).getByText('2026-10-10')).toBeInTheDocument()
    expect(within(restored).getByText('2026-10-12')).toBeInTheDocument()
    expect(screen.getByText('본문')).toBeInTheDocument()
  })

  it('list_card_shows_dates_saved_in_detail_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="dates-board" />)
    await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
    // when
    await user.click(screen.getByRole('button', { name: '시작일 변경' }))
    await user.type(screen.getByLabelText('시작일'), '2026-10-10')
    await user.click(screen.getByRole('button', { name: '종료일 변경' }))
    await user.type(screen.getByLabelText('종료일'), '2026-10-12')
    await user.click(screen.getByRole('button', { name: '← 카드 목록으로 돌아가기' }))
    // then
    const card = screen.getByRole('button', { name: 'Team 카드 열기' })
    expect(within(card).getByLabelText('작업 기간')).toHaveTextContent('26-10-10~26-10-12')
  })

  it('click_card_save_preview_and_reopen_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="board" />)
    // when
    await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
    expect(screen.queryByRole('region', { name: '시작 전 카드 목록' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Team Markdown 문서' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Markdown 작성' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '카드 제목' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '편집' }))
    const editor = screen.getByRole('textbox', { name: 'Markdown 작성' })
    await user.clear(editor)
    await user.type(editor, '# 작업 문서\n**중요**\n- 첫 번째\n```\nconst value = 1\n```')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    const document = screen.getByRole('region', { name: 'Team Markdown 문서' })
    expect(within(document).getByRole('heading', { name: '작업 문서', level: 1 })).toBeInTheDocument()
    expect(within(document).getByText('중요').tagName).toBe('STRONG')
    expect(within(document).getByRole('listitem')).toHaveTextContent('첫 번째')
    expect(within(document).getByText('const value = 1').tagName).toBe('CODE')
    expect(screen.queryByRole('textbox', { name: 'Markdown 작성' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '← 카드 목록으로 돌아가기' }))
    await user.click(screen.getByRole('button', { name: 'Team 카드 열기' }))
    await user.click(screen.getByRole('button', { name: '편집' }))
    // then
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('# 작업 문서\n**중요**\n- 첫 번째\n```\nconst value = 1\n```')
    // when
    await user.clear(screen.getByRole('textbox', { name: 'Markdown 작성' }))
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 문서' })).toBeInTheDocument()
  })

  it('card_list_hides_content_and_detail_preserves_markdown_after_save_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="board" />)
    await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
    await user.click(screen.getByRole('button', { name: '편집' }))
    const editor = screen.getByRole('textbox', { name: 'Markdown 작성' })
    await user.clear(editor)
    // when
    await user.type(editor, '**팀 관리** `code`\n[[문서](https://example.com)')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await user.click(screen.getByRole('button', { name: '← 카드 목록으로 돌아가기' }))
    // then
    const card = screen.getByRole('button', { name: 'Team 카드 열기' })
    expect(within(card).queryByText('팀 관리')).not.toBeInTheDocument()
    expect(within(card).queryByText('code')).not.toBeInTheDocument()
    expect(within(card).queryByText('문서')).not.toBeInTheDocument()
    expect(within(card).queryByRole('link')).not.toBeInTheDocument()
    // when
    await user.click(card)
    // then
    expect(screen.getByText('팀 관리').tagName).toBe('STRONG')
    expect(screen.getByText('code').tagName).toBe('CODE')
    expect(screen.getByRole('link', { name: '문서' })).toHaveAttribute('href', 'https://example.com')
  })

  it('edit_title_updates_list_and_survives_board_remount_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<CardPage boardId="board" />)
    await user.click(await screen.findByRole('button', { name: 'Team 카드 열기' }))
    // when
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.clear(screen.getByRole('textbox', { name: '카드 제목' }))
    await user.type(screen.getByRole('textbox', { name: '카드 제목' }), '새 제목')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('heading', { name: '새 제목' })).toBeInTheDocument()
    expect(screen.queryByText('CARD / MARKDOWN')).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '← 카드 목록으로 돌아가기' }))
    // then
    expect(screen.getByRole('button', { name: '새 제목 카드 열기' })).toBeInTheDocument()
    // when
    view.unmount()
    render(<CardPage boardId="board" />)
    await user.click(await screen.findByRole('button', { name: '새 제목 카드 열기' }))
    // then
    expect(screen.getByRole('heading', { name: '새 제목' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.clear(screen.getByRole('textbox', { name: '카드 제목' }))
    await user.type(screen.getByRole('textbox', { name: '카드 제목' }), '취소할 제목')
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.getByRole('heading', { name: '새 제목' })).toBeInTheDocument()
  })

  it('blank_title_keeps_editor_and_draft_ko', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    // when
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.clear(screen.getByRole('textbox', { name: '카드 제목' }))
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '# 초안')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해 주세요.')
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('# 초안')
  })

  it('empty_markdown_and_unsafe_content_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    // then
    expect(screen.queryByRole('textbox', { name: 'Markdown 작성' })).not.toBeInTheDocument()
    expect(screen.getByText(/작성된 내용이 없습니다/)).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '<script>alert(1)</script>\n[[위험](javascript:alert)')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('storage_failure_preserves_draft_ko', async () => {
    // given
    const user = userEvent.setup()
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    // when
    await user.click(screen.getByRole('button', { name: '편집' }))
    await user.type(screen.getByRole('textbox', { name: 'Markdown 작성' }), '# 초안')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다')
    expect(screen.getByRole('textbox', { name: 'Markdown 작성' })).toHaveValue('# 초안')
    storage.mockRestore()
  })
})
