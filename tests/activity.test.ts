import { describe, expect, it } from 'vitest'
import { getSampleCompletedCard, shiftMonth } from '@/lib/activity'

describe('activity_helpers', () => {
  it('completed_task_card_keeps_identity_project_and_completion_date_ok', () => {
    // given
    const task = { id: '2026-10-10-2', projectId: 'project-2', title: '문서 업데이트', date: '2026-10-10' }
    // when
    const card = getSampleCompletedCard(task)
    // then
    expect(card).toMatchObject({ id: task.id, title: task.title, boardId: 'project-2-login', status: 'DONE', endDate: task.date, cardNumber: 3 })
  })
  it('shift_month_across_year_boundary_ok', () => {
    // when / then
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
  })
})
