import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Workspace } from '@/components/workspace'

const TODAY = '2026-09-09'

describe('workspace', () => {
  it('open_project_common_and_return_home_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
    expect(within(sidebar).getByText('SPACE')).toBeInTheDocument()
    // when
    await user.click(within(sidebar).getByRole('button', { name: /PROJECT/ }))
    // then
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: /프로젝트1.*작업 현황 보기/ }))
    // then
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: '보드1' })).toHaveClass('active')
    // when
    const navigation = screen.getByRole('navigation', { name: '프로젝트 메뉴 선택' })
    await user.click(within(navigation).getByRole('button', { name: 'WORKSPACE' }))
    // then
    expect(screen.getByRole('button', { name: /0720 회의록.md/ })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: '보드1' })).not.toHaveClass('active')
    // when
    await user.click(screen.getByRole('button', { name: '워크스페이스' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 현황', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
  })

  it('toggle_project_folder_by_name_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const sidebar = screen.getByRole('complementary', { name: '워크스페이스 탐색' })
    // when
    await user.click(within(sidebar).getByText('프로젝트1', { exact: true }))
    // then
    expect(within(sidebar).getByText('보드1')).not.toBeVisible()
    // when
    await user.click(within(sidebar).getByText('프로젝트1', { exact: true }))
    // then
    expect(within(sidebar).getByRole('button', { name: '보드1' })).toBeVisible()
  })
  it('return_home_from_board_with_brand_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    await user.click(screen.getByRole('button', { name: '보드1' }))
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: 'w. Work Manager' }))
    // then
    expect(screen.getByRole('heading', { name: '작업 현황', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '프로젝트 선택' })).toHaveValue('all')
    expect(screen.queryByRole('navigation', { name: '프로젝트 메뉴 선택' })).not.toBeInTheDocument()
  })

  it('close_mobile_menu_on_navigation_and_escape_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    // when
    await user.click(screen.getByRole('button', { name: '모바일 메뉴 열기' }))
    await user.click(screen.getByRole('button', { name: '보드1' }))
    // then
    expect(screen.getByRole('button', { name: '모바일 메뉴 열기' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument()
    // when
    await user.click(screen.getByRole('button', { name: '모바일 메뉴 열기' }))
    await user.keyboard('{Escape}')
    // then
    expect(screen.getByRole('button', { name: '모바일 메뉴 열기' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: '모바일 메뉴 닫기' })).not.toBeInTheDocument()
  })

  it('trap_focus_inside_open_mobile_menu_ok', async () => {
    // given
    const user = userEvent.setup()
    render(<Workspace today={TODAY} />)
    const mobileMenuButton = screen.getByRole('button', { name: '모바일 메뉴 열기' })
    // when
    await user.click(mobileMenuButton)
    // then
    expect(screen.getByRole('button', { name: 'w. Work Manager' })).toHaveFocus()
    // when
    await user.tab({ shift: true })
    // then
    expect(screen.getByRole('button', { name: '보드2' })).toHaveFocus()
    // when
    await user.tab()
    // then
    expect(screen.getByRole('button', { name: 'w. Work Manager' })).toHaveFocus()
  })

})
