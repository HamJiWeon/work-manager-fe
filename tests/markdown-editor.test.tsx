import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CardDocument } from '@/components/card-document'
import type { CardItem } from '@/lib/card'

const CARD: CardItem = { id: 'editor', boardId: 'board', cardNumber: 1, memberName: '김민수', projectCode: 'PJT', title: '문서', content: '', status: 'NOT_STARTED' }
beforeEach(() => localStorage.clear())

describe('markdown_editor', () => {
  it('cmd_b_toggles_selection_and_cmd_e_inserts_backticks_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '편집' }))
    const editor = screen.getByRole('textbox', { name: 'Markdown 작성' }) as HTMLTextAreaElement
    await user.type(editor, '선택 내용')
    editor.setSelectionRange(0, editor.value.length)
    // when
    await user.keyboard('{Meta>}b{/Meta}')
    // then
    expect(editor).toHaveValue('**선택 내용**')
    // when
    await user.keyboard('{Meta>}b{/Meta}')
    // then
    expect(editor).toHaveValue('선택 내용')
    // when
    await user.keyboard('{Meta>}e{/Meta}')
    // then
    expect(editor).toHaveValue('`선택 내용`')
  })

  it('empty_selection_typing_undo_redo_and_cmd_s_preview_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '편집' }))
    const editor = screen.getByRole('textbox', { name: 'Markdown 작성' })
    // when
    await user.keyboard('{Meta>}e{/Meta}')
    await user.keyboard('code')
    // then
    expect(editor).toHaveValue('`code`')
    // when
    await user.keyboard('{Meta>}z{/Meta}')
    // then
    expect(editor).toHaveValue('`cod`')
    // when
    await user.keyboard('{Meta>}{Shift>}z{/Shift}{/Meta}')
    // then
    expect(editor).toHaveValue('`code`')
    // when
    await user.keyboard('{Meta>}s{/Meta}')
    // then
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('code').tagName).toBe('CODE')
  })

  it.each([
    ['굵게', '**word**'], ['기울임', '*word*'], ['인라인 코드', '`word`'],
    ['코드 블록', '```\nword\n```'], ['링크', '[word](https://)'],
    ['제목', '## word'], ['글머리 목록', '- word'], ['번호 목록', '1. word'], ['인용', '> word'],
  ])('toolbar_format_%s_ok', async (label, value) => {
    // given
    const user = userEvent.setup()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '편집' }))
    const editor = screen.getByRole('textbox', { name: 'Markdown 작성' }) as HTMLTextAreaElement
    await user.type(editor, 'word')
    editor.setSelectionRange(0, editor.value.length)
    // when
    await user.click(screen.getByRole('button', { name: label }))
    // then
    expect(editor).toHaveValue(value)
    expect(editor).toHaveFocus()
  })

  it('ctrl_shortcuts_and_multiline_list_toggle_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDocument card={CARD} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '편집' }))
    const editor = screen.getByRole('textbox', { name: 'Markdown 작성' }) as HTMLTextAreaElement
    await user.type(editor, 'one\ntwo')
    editor.setSelectionRange(0, editor.value.length)
    // when
    await user.keyboard('{Control>}{Shift>}u{/Shift}{/Control}')
    // then
    expect(editor).toHaveValue('- one\n- two')
    // when
    await user.keyboard('{Control>}{Shift>}u{/Shift}{/Control}')
    // then
    expect(editor).toHaveValue('one\ntwo')
  })
})
