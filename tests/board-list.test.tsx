import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BoardList } from '@/components/board-list'
import type { BoardItem } from '@/lib/board'

describe('board_list', () => {
  it('completed_boards_move_to_bottom_keep_order_and_remain_openable_ok', async () => {
    // given
    const user = userEvent.setup()
    const onOpenBoard = vi.fn()
    const boards: BoardItem[] = [
      { id: 'done-1', name: '완료 A', description: '', progress: 100 },
      { id: 'active', name: '작업 A', description: '', progress: 50 },
      { id: 'done-2', name: '완료 B', description: '', progress: 100 },
      { id: 'new', name: '작업 B', description: '', progress: 0 },
    ]
    const view = render(<BoardList boards={boards} onCreateBoard={vi.fn()} onOpenBoard={onOpenBoard} />)
    // then
    expect(within(screen.getByRole('list')).getAllByRole('heading').map(heading => heading.textContent)).toEqual(['작업 A', '작업 B', '완료 A', '완료 B'])
    // when
    await user.click(screen.getByRole('button', { name: /완료 A/ }))
    // then
    expect(onOpenBoard).toHaveBeenCalledWith(boards[0])
    // when
    view.rerender(<BoardList boards={boards.map(board => board.id === 'active' ? { ...board, progress: 100 } : board)} onCreateBoard={vi.fn()} onOpenBoard={onOpenBoard} />)
    // then
    expect(within(screen.getByRole('list')).getAllByRole('heading').map(heading => heading.textContent)).toEqual(['작업 B', '완료 A', '작업 A', '완료 B'])
    expect(boards.map(board => board.id)).toEqual(['done-1', 'active', 'done-2', 'new'])
  })
})
