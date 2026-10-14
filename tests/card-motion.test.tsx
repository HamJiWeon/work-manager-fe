import { useRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCardMotion } from '@/hooks/use-card-motion'

function MotionExample({ position, idAttribute = 'data-card-id', hidden = false }: { position: number; idAttribute?: string; hidden?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const { handleCapturePositions, handleRememberDrag } = useCardMotion(root, position, null, null, idAttribute)
  return <div ref={root}><div {...{ [idAttribute]: "one" }} hidden={hidden}>카드</div><button onClick={handleCapturePositions}>이동 준비</button><button onClick={() => handleRememberDrag('one')}>드래그 시작</button></div>
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
