import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCardPages } from '@/hooks/use-card-pages'
import type { CardItem, CardPage, CardPageLoader } from '@/lib/card'

const CARD: CardItem = { id: 'one', boardId: 'board', cardNumber: 1, memberName: '나', projectCode: 'PJT', title: '카드', content: '', status: 'DONE' }

describe('card_pages', () => {
  it('prevent_parallel_loads_deduplicate_and_stop_at_end_ok', async () => {
    // given
    let resolve!: (page: CardPage) => void
    const loader = vi.fn<CardPageLoader>().mockImplementationOnce(() => new Promise(done => { resolve = done })).mockResolvedValue({ items: [CARD], nextCursor: null })
    const hook = renderHook(() => useCardPages('board', 'DONE', loader))
    await waitFor(() => expect(loader).toHaveBeenCalledOnce())
    // when
    await act(async () => { hook.result.current.handleLoadMore(); hook.result.current.handleLoadMore() })
    // then
    expect(loader).toHaveBeenCalledOnce()
    // when
    await act(async () => resolve({ items: [CARD], nextCursor: 1 }))
    await act(async () => { hook.result.current.handleLoadMore() })
    await waitFor(() => expect(hook.result.current.hasMore).toBe(false))
    await act(async () => { hook.result.current.handleLoadMore() })
    // then
    expect(hook.result.current.items).toEqual([CARD])
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('unmount_ignores_late_failure_and_aborts_request_ok', async () => {
    // given
    let reject!: (error: Error) => void
    const loader = vi.fn<CardPageLoader>().mockImplementation(() => new Promise((_, fail) => { reject = fail }))
    const hook = renderHook(() => useCardPages('board', 'DONE', loader))
    await waitFor(() => expect(loader).toHaveBeenCalledOnce())
    const signal = loader.mock.calls[0][3]
    // when
    hook.unmount()
    await act(async () => reject(new Error('late failure')))
    // then
    expect(signal.aborted).toBe(true)
  })
})
