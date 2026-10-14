import { useRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCardMotion } from '@/hooks/use-card-motion'

function MotionExample({ position, idAttribute = 'data-card-id', hidden = false, rememberId = 'one', extra = false }: { position: number; idAttribute?: string; hidden?: boolean; rememberId?: string; extra?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const { handleCapturePositions, handleRememberDrag } = useCardMotion(root, position, null, null, idAttribute)
  return <div ref={root}><div {...{ [idAttribute]: "one" }} hidden={hidden}>카드</div>{extra && <div {...{ [idAttribute]: "two" }}>새 카드</div>}<button onClick={handleCapturePositions}>이동 준비</button><button onClick={() => handleRememberDrag(rememberId)}>드래그 시작</button></div>
}

afterEach(() => vi.unstubAllGlobals())

describe('card_motion', () => {
  it('animate_movement_cancel_previous_and_cleanup_ok', async () => {
    // given
    const user = userEvent.setup()
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation)
    const view = render(<MotionExample position={0} />)
    const card = screen.getByText('카드')
    let left = 0
    vi.spyOn(card, 'getBoundingClientRect').mockImplementation(() => ({ left, top: 0 } as DOMRect))
    Object.defineProperty(card, 'animate', { configurable: true, value: animate })
    // when
    await user.click(screen.getByRole('button', { name: '드래그 시작' }))
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    left = 50
    view.rerender(<MotionExample position={1} />)
    // then
    expect(animate).toHaveBeenCalledOnce()
    // when
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    left = 100
    view.rerender(<MotionExample position={2} />)
    // then
    expect(cancel).toHaveBeenCalledOnce()
    expect(animate).toHaveBeenCalledTimes(2)
    // when
    view.unmount()
    // then
    expect(cancel).toHaveBeenCalledTimes(2)
  })

  it('custom_tab_id_and_hidden_drag_origin_animate_ok', async () => {
    // given
    const user = userEvent.setup()
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation)
    const view = render(<MotionExample position={0} idAttribute="data-tab-id" />)
    const tab = screen.getByText('카드')
    let left = 0
    vi.spyOn(tab, 'getBoundingClientRect').mockImplementation(() => ({ left, top: 0 } as DOMRect))
    Object.defineProperty(tab, 'animate', { configurable: true, value: animate })
    // when
    await user.click(screen.getByRole('button', { name: '드래그 시작' }))
    view.rerender(<MotionExample position={0} idAttribute="data-tab-id" hidden />)
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    left = 60
    view.rerender(<MotionExample position={1} idAttribute="data-tab-id" />)
    // then
    expect(animate).toHaveBeenCalledWith([{ transform: 'translate(-60px, 0px)' }, { transform: 'translate(0, 0)' }], expect.objectContaining({ duration: 260 }))
  })

  it('missing_drag_origin_and_hidden_items_skip_animation_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<MotionExample position={0} rememberId="missing" />)
    const animate = vi.fn()
    Object.defineProperty(screen.getByText('카드'), 'animate', { configurable: true, value: animate })
    // when
    await user.click(screen.getByRole('button', { name: '드래그 시작' }))
    view.rerender(<MotionExample position={0} hidden rememberId="missing" />)
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    view.rerender(<MotionExample position={1} hidden rememberId="missing" />)
    // then
    expect(animate).not.toHaveBeenCalled()
  })

  it('unchanged_position_and_new_items_do_not_animate_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<MotionExample position={0} />)
    const animate = vi.fn()
    Object.defineProperty(screen.getByText('카드'), 'animate', { configurable: true, value: animate })
    // when
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    view.rerender(<MotionExample position={1} extra />)
    // then
    expect(animate).not.toHaveBeenCalled()
    expect(screen.getByText('새 카드')).toBeVisible()
    // when
    Object.defineProperty(screen.getByText('새 카드'), 'animate', { configurable: true, value: animate })
    view.rerender(<MotionExample position={2} />)
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    view.rerender(<MotionExample position={3} extra />)
    // then
    expect(animate).not.toHaveBeenCalled()
  })

  it('vertical_only_movement_animate_ok', async () => {
    // given
    const user = userEvent.setup()
    const view = render(<MotionExample position={0} />)
    const card = screen.getByText('카드')
    let top = 0
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation)
    vi.spyOn(card, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top } as DOMRect))
    Object.defineProperty(card, 'animate', { configurable: true, value: animate })
    // when
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    top = 40
    view.rerender(<MotionExample position={1} />)
    // then
    expect(animate).toHaveBeenCalledWith([{ transform: 'translate(0px, -40px)' }, { transform: 'translate(0, 0)' }], expect.objectContaining({ duration: 260 }))
  })

  it('reduced_motion_does_not_animate_ok', async () => {
    // given
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const user = userEvent.setup()
    const view = render(<MotionExample position={0} />)
    const animate = vi.fn()
    Object.defineProperty(screen.getByText('카드'), 'animate', { configurable: true, value: animate })
    // when
    await user.click(screen.getByRole('button', { name: '이동 준비' }))
    view.rerender(<MotionExample position={1} />)
    // then
    expect(animate).not.toHaveBeenCalled()
  })
})
