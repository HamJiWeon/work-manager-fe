import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('create_with_member_and_dates_without_expanding_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="compact-details" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    // when
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '일정 작업')
    await user.selectOptions(screen.getByRole('combobox', { name: '담당자' }), '이서연')
    await user.type(screen.getByLabelText('시작일'), '2026-10-14')
    await user.type(screen.getByLabelText('종료일'), '2026-10-16')
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    // then
    expect(screen.getByRole('combobox', { name: '담당자' })).toHaveValue('이서연')
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-10-14')
    // when
    await user.click(screen.getByRole('button', { name: '카드 추가 창 축소' }))
    // then
    expect(screen.getByLabelText('종료일')).toHaveValue('2026-10-16')
    // when
    await user.click(screen.getByRole('button', { name: '추가' }))
    const card = await screen.findByRole('button', { name: '일정 작업 카드 열기' })
    // then
    expect(within(card).getByLabelText('작업 기간')).toHaveTextContent('26-10-14~26-10-16')
    expect(within(card).getByRole('img', { name: '이서연 프로필 사진' })).toBeInTheDocument()
    // when
    await user.click(card)
    // then
    expect(screen.getByRole('button', { name: '담당자 변경' })).toHaveTextContent('이서연')
    expect(screen.getByRole('button', { name: '종료일 변경' })).toHaveTextContent('2026-10-16')
  })

  it.each(['시작일', '종료일'])('reject_six_digit_year_and_allow_correction_ok_%s', async label => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="date-range" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    // when
    await user.type(screen.getByLabelText(label), '202020-02-20')
    // then
    expect(screen.getByLabelText(label)).toHaveValue('')
    expect(screen.getByRole('alert')).toHaveTextContent('날짜의 연도는 1~9999년으로 입력해 주세요.')
    // when
    await user.type(screen.getByLabelText(label), '2020-02-20')
    // then
    expect(screen.getByLabelText(label)).toHaveValue('2020-02-20')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each(['시작일', '종료일'])('rejected_date_blocks_save_after_other_field_changes_ok_%s', async label => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="rejected-date" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '거부 날짜')
    // when
    await user.type(screen.getByLabelText(label), '202020-02-20')
    await user.type(screen.getByLabelText(label === '시작일' ? '종료일' : '시작일'), '2026-10-15')
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    expect(screen.getByRole('dialog', { name: '카드 추가' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('날짜의 연도는 1~9999년으로 입력해 주세요.')
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('button', { name: '거부 날짜 카드 열기' })).not.toBeInTheDocument()
    // when
    await user.type(screen.getByLabelText(label), '2026-10-15')
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    expect(await screen.findByRole('button', { name: '거부 날짜 카드 열기' })).toBeInTheDocument()
  })

  it('rejected_existing_date_blocks_shortcut_until_explicitly_cleared_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="rejected-existing" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '이전 날짜')
    await user.type(screen.getByLabelText('시작일'), '2026-10-14')
    // when
    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '202020-02-20' } })
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    await user.click(screen.getByRole('textbox', { name: '내용' }))
    await user.keyboard('{Control>}s{/Control}')
    // then
    expect(screen.getByRole('region', { name: '새 카드 작성' })).toBeInTheDocument()
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-10-14')
    expect(screen.getByRole('alert')).toHaveTextContent('날짜의 연도는 1~9999년으로 입력해 주세요.')
    // when
    await user.clear(screen.getByLabelText('시작일'))
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    const card = await screen.findByRole('button', { name: '이전 날짜 카드 열기' })
    expect(within(card).getByLabelText('작업 기간')).toHaveTextContent('시작일 미지정~종료일 미지정')
  })

  it.each(['시작일', '종료일'])('reset_rejected_empty_date_and_save_unspecified_ok_%s', async label => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="reset-empty-date" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '날짜 초기화')
    await user.type(screen.getByLabelText(label), '202020-02-20')
    // when
    await user.click(screen.getByLabelText(label))
    await user.keyboard('{Backspace}{Delete}')
    // then
    expect(screen.getByLabelText(label)).toHaveValue('')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: `${label} 초기화` }))
    // then
    expect(screen.getByLabelText(label)).toHaveFocus()
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `${label} 초기화` })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    const card = await screen.findByRole('button', { name: '날짜 초기화 카드 열기' })
    expect(within(card).getByLabelText('작업 기간')).toHaveTextContent('시작일 미지정~종료일 미지정')
  })

  it('reset_one_rejected_date_preserves_other_rejection_across_views_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="reset-both-dates" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '두 날짜 초기화')
    await user.type(screen.getByLabelText('시작일'), '202020-02-20')
    await user.type(screen.getByLabelText('종료일'), '202020-02-20')
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    // when
    await user.click(screen.getByRole('button', { name: '시작일 초기화' }))
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('시작일')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('종료일')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('button', { name: '시작일 초기화' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '종료일 초기화' }))
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(await screen.findByRole('button', { name: '두 날짜 초기화 카드 열기' })).toBeInTheDocument()
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
    expect(screen.getByLabelText('시작일')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('종료일')).not.toHaveAttribute('aria-describedby')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await user.click(await screen.findByRole('button', { name: '확대 작성 카드 열기' }))
    // then
    expect(screen.getByRole('heading', { name: '확대 작성', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('상세 내용')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '담당자 변경' })).toHaveTextContent('김민수')
    expect(screen.getByRole('button', { name: '시작일 변경' })).toHaveTextContent('2026-10-14')
    expect(screen.getByRole('button', { name: '종료일 변경' })).toHaveTextContent('2026-10-15')
  })

  it('keyboard_expand_collapse_and_cancel_manage_focus_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="focus-board" />)
    const trigger = screen.getByRole('button', { name: '시작 전 카드 추가' })
    await user.click(trigger)
    const expand = screen.getByRole('button', { name: '카드 추가 창 확대' })
    // when
    expand.focus()
    await user.keyboard('{Enter}')
    // then
    await waitFor(() => expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveFocus())
    // when
    await user.keyboard('{Tab}{Enter}')
    // then
    expect(screen.getByRole('dialog', { name: '카드 추가' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveFocus())
    // when
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('region', { name: '새 카드 작성' })).not.toBeInTheDocument()
  })

  it('expanded_reversed_dates_preserve_draft_and_allow_correction_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="invalid-dates" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '기간 검증')
    await user.type(screen.getByRole('textbox', { name: '내용' }), '본문 유지')
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    await user.type(screen.getByLabelText('시작일'), '2026-10-15')
    await user.type(screen.getByLabelText('종료일'), '2026-10-14')
    // when
    await user.click(screen.getByRole('textbox', { name: '내용' }))
    await user.keyboard('{Control>}s{/Control}')
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('종료일은 시작일 이후로 지정해 주세요.')
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toBeValid()
    expect(screen.getByLabelText('시작일')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('종료일')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('시작일')).toHaveAccessibleDescription('종료일은 시작일 이후로 지정해 주세요.')
    expect(screen.getByLabelText('종료일')).toHaveAccessibleDescription('종료일은 시작일 이후로 지정해 주세요.')
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), ' 수정')
    expect(screen.getByRole('alert')).toHaveTextContent('종료일은 시작일 이후로 지정해 주세요.')
    await user.clear(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '기간 검증')
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('본문 유지')
    expect(screen.queryByRole('button', { name: '기간 검증 카드 열기' })).not.toBeInTheDocument()
    // when
    await user.clear(screen.getByLabelText('종료일'))
    await user.type(screen.getByLabelText('종료일'), '2026-10-15')
    expect(screen.getByLabelText('시작일')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('종료일')).not.toHaveAttribute('aria-describedby')
    await user.click(screen.getByRole('button', { name: '저장' }))
    // then
    expect(await screen.findByRole('button', { name: '기간 검증 카드 열기' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '새 카드 작성' })).not.toBeInTheDocument()
  })

  it('expanded_formatting_and_cancel_reset_all_fields_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<CardPage boardId="cancel-expanded" />)
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '취소할 카드')
    await user.selectOptions(screen.getByRole('combobox', { name: '담당자' }), '김민수')
    await user.type(screen.getByLabelText('시작일'), '2026-10-14')
    // when
    await user.type(screen.getByRole('textbox', { name: '내용' }), '강조')
    await user.keyboard('{Control>}a{/Control}')
    await user.click(screen.getByRole('button', { name: '굵게' }))
    // then
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('**강조**')
    // when
    await user.click(screen.getByRole('button', { name: '취소' }))
    // then
    expect(screen.queryByRole('region', { name: '새 카드 작성' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '취소할 카드 카드 열기' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '시작 전 카드 추가' }))
    await user.click(screen.getByRole('button', { name: '카드 추가 창 확대' }))
    // then
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: '담당자' })).toHaveValue('나')
    expect(screen.getByLabelText('시작일')).toHaveValue('')
    expect(screen.getByLabelText('종료일')).toHaveValue('')
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
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toBeInvalid()
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toHaveAccessibleDescription('제목을 입력해 주세요.')
    // when
    await user.type(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' }), '초안')
    await user.type(screen.getByRole('textbox', { name: '내용' }), '작성 중 내용')
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    await user.click(screen.getByRole('button', { name: '추가' }))
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('카드를 저장하지 못했습니다.')
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).toBeValid()
    expect(screen.getByRole('textbox', { name: '시작 전 새 카드 제목' })).not.toHaveAttribute('aria-describedby')
    expect(screen.getByRole('form', { name: '카드 추가 입력' })).toHaveAccessibleDescription('카드를 저장하지 못했습니다. 다시 시도해 주세요.')
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
