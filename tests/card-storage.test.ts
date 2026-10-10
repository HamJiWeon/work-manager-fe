import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readBoardDocuments, readCardDocument } from '@/lib/card-document'
import { createCard, readCreatedCards } from '@/lib/created-cards'
import { readWorkspaceDocument } from '@/lib/workspace-document'
import type { CardItem } from '@/lib/card'

const CARD: CardItem = { id: 'one', boardId: 'board', cardNumber: 1, memberName: '나', projectCode: 'PJT', title: '제목', content: '', status: 'NOT_STARTED' }
beforeEach(() => localStorage.clear())

describe('card_storage', () => {
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

  it('created_cards_validate_data_and_allocate_unique_numbers_ok', () => {
    // given
    localStorage.setItem('work-manager:created-cards:board', JSON.stringify([null, {}, { ...CARD, boardId: 'other' }, { ...CARD, cardNumber: -1 }]))
    // when
    const first = createCard('board', 'DONE', ' 작업 ')
    const second = createCard('board', 'NOT_STARTED', '두 번째')
    // then
    expect(first.title).toBe('작업')
    expect(second.cardNumber).toBe(first.cardNumber + 1)
    expect(second.id).not.toBe(first.id)
    expect(readCreatedCards('board')).toEqual([first, second])
    expect(() => createCard('board', 'DONE', ' ')).toThrow('제목을 입력해 주세요.')
    localStorage.setItem('work-manager:created-cards:board', '{}')
    expect(readCreatedCards('board')).toEqual([])
  })
})
