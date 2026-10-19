import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthenticatedWorkspace } from '@/components/authenticated-workspace'
import { useStorageUserId } from '@/components/storage-user'
import { readBoardDocuments, readCardDocument, saveCardDocument } from '@/lib/card-document'
import { createCard, readCreatedCards } from '@/lib/created-cards'
import { readWorkspaceDocument, saveWorkspaceDocument } from '@/lib/workspace-document'
import { userStoragePrefix } from '@/lib/user-storage'
import type { CardItem } from '@/lib/card'

const mocks = vi.hoisted(() => ({ restore: vi.fn(), logout: vi.fn(), replace: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const router = { replace: mocks.replace }
vi.mock('@/lib/auth', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/auth')>(),
  restoreSession: mocks.restore, logout: mocks.logout,
}))
vi.mock('@/components/main-page', () => ({
  MainPage: function StorageProbe({ onLogout }: { onLogout: () => void }) {
    const userId = useStorageUserId()
    return <><p>{JSON.stringify(readBoardDocuments('board', userId))}</p>
      <p>{JSON.stringify(readCreatedCards('board', userId))}</p>
      <p>{JSON.stringify(readWorkspaceDocument('project', 'document', userId))}</p>
      <button onClick={onLogout}>로그아웃</button></>
  },
}))

const CARD: CardItem = { id: 'card', boardId: 'board', cardNumber: 1, memberName: '나', projectCode: 'PJT', title: '기본 제목', content: '', status: 'NOT_STARTED' }
const DOCUMENT = { title: 'A의 비공개 문서', content: 'A의 본문' }
const USER_A = { id: 'user-a', name: 'A', email: null, profileImgUrl: null }
const USER_B = { ...USER_A, id: 'user-b', name: 'B' }

beforeEach(() => { localStorage.clear(); vi.resetAllMocks() })

describe('user_storage_isolation', () => {
  it('same_resource_ids_are_isolated_between_accounts_ok', () => {
    // given
    saveCardDocument(CARD, DOCUMENT, USER_A.id)
    saveWorkspaceDocument('project', 'document', DOCUMENT, USER_A.id)
    const cardA = createCard('board', 'A의 카드', '', {}, USER_A.id)
    // when / then
    expect(readCardDocument(CARD, USER_B.id)).toBeNull()
    expect(readBoardDocuments('board', USER_B.id)).toEqual({})
    expect(readCreatedCards('board', USER_B.id)).toEqual([])
    expect(readWorkspaceDocument('project', 'document', USER_B.id)).toBeNull()
    // when
    saveCardDocument(CARD, { title: 'B의 문서', content: 'B의 본문' }, USER_B.id)
    saveWorkspaceDocument('project', 'document', { title: 'B의 공통 문서', content: '' }, USER_B.id)
    createCard('board', 'B의 카드', '', {}, USER_B.id)
    // then
    expect(readCardDocument(CARD, USER_A.id)).toEqual(DOCUMENT)
    expect(readBoardDocuments('board', USER_A.id)).toEqual({ card: DOCUMENT })
    expect(readCreatedCards('board', USER_A.id)).toEqual([cardA])
    expect(readWorkspaceDocument('project', 'document', USER_A.id)).toEqual(DOCUMENT)
  })

  it('unowned_legacy_data_is_not_adopted_by_any_account_ok', () => {
    // given
    localStorage.setItem('work-manager:card-document:board:card', JSON.stringify(DOCUMENT))
    localStorage.setItem('work-manager:card-markdown:board:card', '소유자 불명 본문')
    localStorage.setItem('work-manager:workspace-document:project:document', JSON.stringify(DOCUMENT))
    localStorage.setItem('work-manager:created-cards:board', JSON.stringify([{ ...CARD, title: '공용 카드' }]))
    // when / then
    expect(readCardDocument(CARD, USER_A.id)).toBeNull()
    expect(readBoardDocuments('board', USER_A.id)).toEqual({})
    expect(readCreatedCards('board', USER_A.id)).toEqual([])
    expect(readWorkspaceDocument('project', 'document', USER_A.id)).toBeNull()
    expect(readCardDocument(CARD, USER_B.id)).toBeNull()
    expect(localStorage.getItem('work-manager:card-markdown:board:card')).toBe('소유자 불명 본문')
  })

  it('user_ids_cannot_overlap_storage_prefixes_ok', () => {
    // given / when / then
    expect(userStoragePrefix('a:b', 'card-document')).not.toBe(userStoragePrefix('a%3Ab', 'card-document'))
    expect(() => userStoragePrefix('', 'card-document')).toThrow('저장소 사용자 정보가 필요합니다.')
  })

  it('logout_then_another_login_does_not_show_previous_account_content_ok', async () => {
    // given
    const actor = userEvent.setup()
    saveCardDocument(CARD, DOCUMENT, USER_A.id)
    saveWorkspaceDocument('project', 'document', DOCUMENT, USER_A.id)
    createCard('board', 'A의 카드', '', {}, USER_A.id)
    mocks.restore.mockResolvedValueOnce(USER_A).mockResolvedValueOnce(USER_B).mockResolvedValueOnce(USER_A)
    mocks.logout.mockResolvedValue(undefined)
    const first = render(<AuthenticatedWorkspace today="2026-10-19" />)
    await screen.findByRole('button', { name: '로그아웃' })
    expect(screen.getAllByText(/A의 비공개 문서/)).toHaveLength(2)
    // when
    await actor.click(screen.getByRole('button', { name: '로그아웃' }))
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'))
    first.unmount()
    const second = render(<AuthenticatedWorkspace today="2026-10-19" />)
    await screen.findByRole('button', { name: '로그아웃' })
    // then
    expect(screen.queryByText(/A의 비공개 문서/)).not.toBeInTheDocument()
    expect(screen.queryByText(/A의 카드/)).not.toBeInTheDocument()
    // when
    second.unmount()
    render(<AuthenticatedWorkspace today="2026-10-19" />)
    await screen.findByRole('button', { name: '로그아웃' })
    // then
    expect(screen.getAllByText(/A의 비공개 문서/)).toHaveLength(2)
    expect(screen.getByText(/A의 카드/)).toBeInTheDocument()
  })
})
