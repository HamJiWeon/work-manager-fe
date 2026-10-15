import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readBoardDocuments, readCardDocument } from '@/lib/card-document'
import { createCard, readCreatedCards } from '@/lib/created-cards'
import { readWorkspaceDocument } from '@/lib/workspace-document'
import type { CardItem } from '@/lib/card'

const CARD: CardItem = { id: 'one', boardId: 'board', cardNumber: 1, memberName: '나', projectCode: 'PJT', title: '제목', content: '', status: 'NOT_STARTED' }
beforeEach(() => localStorage.clear())

describe('card_storage', () => {
  it.each(['memberName', 'startDate', 'endDate'])('reject_malformed_%s_metadata_ok', (field) => {
    // given
    const invalidValues = [123, null, true, {}, []]
    for (const [index, value] of invalidValues.entries()) {
      localStorage.setItem(`work-manager:card-document:board:invalid-${index}`, JSON.stringify({ title: '문서', content: '본문', [field]: value }))
    }
    localStorage.setItem('work-manager:card-document:board:one', JSON.stringify({ title: '문서', content: '본문', [field]: 123 }))
    // when
    const document = readCardDocument(CARD)
    const documents = readBoardDocuments('board')
    // then
    expect(document).toBeNull()
    expect(documents).toEqual({})
  })

  it.each([
    { title: '문서', content: '본문' },
    { title: '문서', content: '본문', memberName: '담당자', startDate: '2026-10-12', endDate: '2026-10-13' },
    { title: '문서', content: '본문', memberName: '', startDate: '', endDate: '' },
  ])('restore_valid_optional_metadata_ok_%#', (saved) => {
    // given
    localStorage.setItem('work-manager:card-document:board:one', JSON.stringify(saved))
    // when
    const document = readCardDocument(CARD)
    const documents = readBoardDocuments('board')
    // then
    expect(document).toEqual(saved)
    expect(documents).toEqual({ one: saved })
  })

  it('restore_legacy_when_optional_metadata_is_malformed_ok', () => {
    // given
    localStorage.setItem('work-manager:card-document:board:one', JSON.stringify({ title: '문서', content: '본문', memberName: 123 }))
    localStorage.setItem('work-manager:card-markdown:board:one', '이전 본문')
    // when
    const document = readCardDocument(CARD)
    // then
    expect(document).toEqual({ title: CARD.title, content: '이전 본문' })
  })

  it('restore_legacy_skip_corrupt_and_other_board_documents_ok', () => {
    // given
    localStorage.setItem('work-manager:card-document:board:one', '{broken')
    localStorage.setItem('work-manager:card-document:board:two', JSON.stringify({ title: '문서', content: '본문' }))
    localStorage.setItem('work-manager:card-document:board:three', 'null')
    localStorage.setItem('work-manager:card-document:other:four', JSON.stringify({ title: '다른 보드', content: '' }))
    // when / then
    expect(readCardDocument(CARD)).toBeNull()
    expect(readBoardDocuments('board')).toEqual({ two: { title: '문서', content: '본문' } })
    localStorage.removeItem('work-manager:card-document:board:one')
    localStorage.setItem('work-manager:card-markdown:board:one', '이전 본문')
    expect(readCardDocument(CARD)).toEqual({ title: '제목', content: '이전 본문' })
  })

  it('unavailable_storage_returns_empty_results_ok', () => {
    // given
    const storage = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    // when / then
    expect(readCreatedCards('board')).toEqual([])
    expect(readWorkspaceDocument('board', 'document')).toBeNull()
    expect(readCardDocument(CARD)).toBeNull()
    storage.mockRestore()
    const keys = vi.spyOn(Storage.prototype, 'key').mockImplementation(() => { throw new Error('denied') })
    localStorage.setItem('any', 'value')
    expect(readBoardDocuments('board')).toEqual({})
    keys.mockRestore()
  })

  it.each(['memberAvatarUrl', 'startDate', 'endDate'])('created_cards_skip_malformed_%s_ok', (field) => {
    // given
    const invalidValues = [123, null, true, {}, []]
    const corruptedCards = invalidValues.map((value, index) => ({ ...CARD, id: `invalid-${index}`, [field]: value }))
    localStorage.setItem('work-manager:created-cards:board', JSON.stringify([...corruptedCards, CARD]))
    // when
    const cards = readCreatedCards('board')
    // then
    expect(cards).toEqual([CARD])
  })

  it.each([
    CARD,
    { ...CARD, memberAvatarUrl: '/avatars/member-1.svg', startDate: '2026-10-12', endDate: '2026-10-13' },
    { ...CARD, memberAvatarUrl: '', startDate: '', endDate: '' },
  ])('created_cards_restore_valid_optional_fields_ok_%#', (saved) => {
    // given
    localStorage.setItem('work-manager:created-cards:board', JSON.stringify([saved]))
    // when
    const cards = readCreatedCards('board')
    // then
    expect(cards).toEqual([saved])
  })

  it.each(['startDate', 'endDate'] as const)('created_card_rejects_six_digit_year_ko_%s', field => {
    // given / when / then
    expect(() => createCard('board', '날짜 검증', '', { [field]: '202020-02-20' })).toThrow('1~9999년 범위의 올바른 날짜를 입력해 주세요.')
    expect(readCreatedCards('board')).toEqual([])
  })

  it.each([
    { startDate: '2026-02-31' },
    { endDate: '2026-99-99' },
    { startDate: '2026-02-29' },
    { endDate: '1900-02-29' },
  ])('created_card_rejects_impossible_calendar_date_without_changing_storage_ko_%#', details => {
    // given
    const existing = createCard('board', '기존 카드')
    // when / then
    expect(() => createCard('board', '잘못된 날짜', '', details)).toThrow('1~9999년 범위의 올바른 날짜를 입력해 주세요.')
    expect(readCreatedCards('board')).toEqual([existing])
  })

  it('created_card_saves_and_restores_valid_leap_day_ok', () => {
    // given / when
    const card = createCard('board', '윤년 일정', '', { startDate: '2000-02-29', endDate: '2024-02-29' })
    // then
    expect(readCreatedCards('board')).toEqual([card])
    expect(card.startDate).toBe('2000-02-29')
    expect(card.endDate).toBe('2024-02-29')
  })

  it('created_card_rejects_reversed_dates_without_changing_saved_cards_ko', () => {
    // given
    const existing = createCard('board', '기존 카드')
    // when / then
    expect(() => createCard('board', '잘못된 기간', '본문', { startDate: '2026-10-15', endDate: '2026-10-14' })).toThrow('종료일은 시작일 이후로 지정해 주세요.')
    expect(readCreatedCards('board')).toEqual([existing])
  })

  it.each([
    { startDate: '2026-10-14', endDate: '2026-10-14' },
    { startDate: '2026-10-14' },
    { endDate: '2026-10-15' },
  ])('created_card_accepts_same_day_and_partial_dates_ok_%#', details => {
    // given / when
    const card = createCard('board', '기간 입력', '본문', { memberName: '', ...details })
    // then
    expect(card).toMatchObject({ title: '기간 입력', content: '본문', memberName: '', ...details })
    expect(card.memberAvatarUrl).toBeUndefined()
    expect(readCreatedCards('board')).toEqual([card])
  })

  it('created_cards_validate_data_and_allocate_unique_numbers_ok', () => {
    // given
    localStorage.setItem('work-manager:created-cards:board', JSON.stringify([null, {}, { ...CARD, boardId: 'other' }, { ...CARD, cardNumber: -1 }]))
    // when
    const first = createCard('board', ' 작업 ')
    const second = createCard('board', '두 번째')
    // then
    expect(first.title).toBe('작업')
    expect(first.status).toBe('NOT_STARTED')
    expect(second.status).toBe('NOT_STARTED')
    expect(second.cardNumber).toBe(first.cardNumber + 1)
    expect(second.id).not.toBe(first.id)
    expect(readCreatedCards('board')).toEqual([first, second])
    expect(() => createCard('board', ' ')).toThrow('제목을 입력해 주세요.')
    localStorage.setItem('work-manager:created-cards:board', '{}')
    expect(readCreatedCards('board')).toEqual([])
  })
})
