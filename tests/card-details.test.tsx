import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CardDetails } from '@/components/card-details'
import type { CardItem } from '@/lib/card'

const CARD: CardItem = { id: 'one', boardId: 'board', cardNumber: 1, memberName: '', projectCode: 'PJT', title: '제목', content: '', status: 'NOT_STARTED', startDate: '2026-10-12' }
beforeEach(() => localStorage.clear())

describe('card_details', () => {
  it('invalid_period_keeps_previous_value_and_escape_closes_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDetails card={CARD} />)
    expect(screen.getByRole('button', { name: '담당자 변경' })).toHaveTextContent('미지정')
    // when
    await user.click(screen.getByRole('button', { name: '종료일 변경' }))
    await user.type(screen.getByLabelText('종료일'), '2026-10-10')
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('종료일은 시작일 이후로 지정해 주세요.')
    expect(screen.getByLabelText('종료일')).toHaveValue('')
    // when
    await user.keyboard('{Escape}')
    // then
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '종료일 변경' })).toHaveTextContent('날짜 미지정')
  })

  it('storage_failure_preserves_assignee_and_retry_saves_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardDetails card={CARD} />)
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    // when
    await user.click(screen.getByRole('button', { name: '담당자 변경' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '담당자' }), '나')
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다.')
    expect(screen.getByRole('combobox', { name: '담당자' })).toHaveValue('')
    storage.mockRestore()
    // when
    await user.selectOptions(screen.getByRole('combobox', { name: '담당자' }), '나')
    // then
    expect(screen.getByRole('button', { name: '담당자 변경' })).toHaveTextContent('나')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
