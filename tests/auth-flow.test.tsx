import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError } from '@/lib/auth'
import { OAuthCallback } from '@/components/oauth-callback'
import { AuthenticatedWorkspace } from '@/components/authenticated-workspace'
import { RegistrationPage } from '@/components/registration-page'

const mocks = vi.hoisted(() => ({ replace: vi.fn(), restore: vi.fn(), pending: vi.fn(), complete: vi.fn(), logout: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const router = { replace: mocks.replace }
vi.mock('@/lib/auth', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/auth')>(),
  restoreSession: mocks.restore, getPendingRegistration: mocks.pending,
  completeRegistration: mocks.complete, logout: mocks.logout,
}))
vi.mock('@/components/main-page', () => ({ MainPage: ({ user, onLogout }: { user: { name: string }; onLogout: () => void }) => <div>{user.name}<button onClick={onLogout}>로그아웃</button></div> }))

const user = { id: 'user-1', name: '사용자', email: null, profileImgUrl: null }
const registration = {
  name: '신규 사용자', provider: 'GOOGLE', terms: [
    { id: 'terms', title: '이용약관', version: 'v1', content: '서버에서 제공한 이용약관', required: true },
    { id: 'privacy', title: '개인정보 수집·이용', version: 'v2', content: '서버에서 제공한 개인정보 안내', required: true },
    { id: 'news', title: '소식 수신', version: 'v1', content: '선택 사항', required: false },
  ],
}

beforeEach(() => { vi.resetAllMocks(); window.history.replaceState({}, '', '/oauth/callback') })

describe('authentication_flow', () => {
  it('signup_required_status_goes_to_signup_without_session_requests_ok', async () => {
    // given
    window.history.replaceState({}, '', '/oauth/callback?status=SIGNUP_REQUIRED')
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/signup'))
    expect(mocks.pending).not.toHaveBeenCalled()
    expect(mocks.restore).not.toHaveBeenCalled()
  })

  it('login_complete_status_verifies_session_before_main_navigation_ok', async () => {
    // given
    window.history.replaceState({}, '', '/oauth/callback?status=LOGIN_COMPLETE')
    mocks.restore.mockResolvedValue(user)
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/workspace'))
    expect(mocks.restore).toHaveBeenCalledTimes(1)
    expect(mocks.pending).not.toHaveBeenCalled()
  })

  it('forged_login_complete_status_does_not_bypass_authentication_ko', async () => {
    // given
    window.history.replaceState({}, '', '/oauth/callback?status=LOGIN_COMPLETE')
    mocks.restore.mockRejectedValue(new AuthError(401))
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login?error=oauth'))
    expect(mocks.replace).not.toHaveBeenCalledWith('/workspace')
  })

  it('unknown_callback_status_goes_to_login_ko', async () => {
    // given
    window.history.replaceState({}, '', '/oauth/callback?status=UNKNOWN')
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login?error=oauth'))
    expect(mocks.replace).not.toHaveBeenCalledWith('/workspace')
    expect(mocks.pending).not.toHaveBeenCalled()
    expect(mocks.restore).not.toHaveBeenCalled()
  })

  it('new_social_user_goes_to_registration_ok', async () => {
    // given
    mocks.pending.mockResolvedValue(registration)
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/signup'))
    expect(mocks.restore).not.toHaveBeenCalled()
  })

  it('existing_user_is_verified_before_main_navigation_ok', async () => {
    // given
    mocks.pending.mockResolvedValue(null)
    mocks.restore.mockResolvedValue(user)
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/workspace'))
  })

  it('cancelled_or_expired_login_goes_to_login_ko', async () => {
    // given
    mocks.pending.mockRejectedValue(new AuthError(401))
    // when
    render(<OAuthCallback />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login?error=oauth'))
    expect(mocks.replace).not.toHaveBeenCalledWith('/workspace')
  })

  it.each([new Error('network'), new AuthError(500)])('callback_transient_error_can_be_retried_ok_%#', async cause => {
    // given
    const actor = userEvent.setup()
    window.history.replaceState({}, '', '/oauth/callback?status=LOGIN_COMPLETE')
    mocks.restore.mockRejectedValueOnce(cause).mockResolvedValueOnce(user)
    render(<OAuthCallback />)
    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 후 다시 시도')
    expect(mocks.replace).not.toHaveBeenCalled()
    // when
    await actor.click(screen.getByRole('button', { name: '다시 시도' }))
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/workspace'))
    expect(mocks.replace).not.toHaveBeenCalledWith('/login?error=oauth')
  })

  it('workspace_is_hidden_until_session_is_verified_ok', async () => {
    // given
    let resolveUser!: (value: typeof user) => void
    mocks.restore.mockReturnValue(new Promise(resolve => { resolveUser = resolve }))
    render(<AuthenticatedWorkspace today="2026-10-15" />)
    expect(screen.getByRole('status')).toHaveTextContent('잠시만')
    expect(screen.queryByText('사용자')).not.toBeInTheDocument()
    // when
    resolveUser(user)
    // then
    expect(await screen.findByText('사용자')).toBeInTheDocument()
  })

  it('unauthenticated_workspace_goes_to_login_ko', async () => {
    // given
    mocks.restore.mockRejectedValue(new AuthError(401))
    // when
    render(<AuthenticatedWorkspace today="2026-10-15" />)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument()
  })

  it('session_network_error_can_be_retried_ok', async () => {
    // given
    const actor = userEvent.setup()
    mocks.restore.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(user)
    render(<AuthenticatedWorkspace today="2026-10-15" />)
    await screen.findByRole('alert')
    // when
    await actor.click(screen.getByRole('button', { name: '다시 시도' }))
    // then
    expect(await screen.findByText('사용자')).toBeInTheDocument()
  })

  it('logout_revokes_session_before_navigation_ok', async () => {
    // given
    const actor = userEvent.setup()
    mocks.restore.mockResolvedValue(user)
    mocks.logout.mockResolvedValue(undefined)
    render(<AuthenticatedWorkspace today="2026-10-15" />)
    // when
    await actor.click(await screen.findByRole('button', { name: '로그아웃' }))
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'))
    expect(mocks.logout).toHaveBeenCalledTimes(1)
  })

  it('registration_requires_mandatory_consents_and_preserves_optional_choice_ok', async () => {
    // given
    const actor = userEvent.setup()
    mocks.pending.mockResolvedValue(registration)
    mocks.complete.mockResolvedValue(undefined)
    mocks.restore.mockResolvedValue(user)
    render(<RegistrationPage />)
    const submit = await screen.findByRole('button', { name: '동의하고 가입하기' })
    expect(submit).toBeDisabled()
    // when
    await actor.click(screen.getByRole('checkbox', { name: '[필수] 이용약관' }))
    expect(submit).toBeDisabled()
    await actor.click(screen.getByRole('checkbox', { name: '[필수] 개인정보 수집·이용' }))
    await actor.click(submit)
    // then
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/workspace'))
    expect(mocks.complete).toHaveBeenCalledWith([
      { id: 'terms', version: 'v1', agreed: true }, { id: 'privacy', version: 'v2', agreed: true }, { id: 'news', version: 'v1', agreed: false },
    ])
  })

  it('missing_pending_registration_does_not_show_consent_form_ko', async () => {
    // given
    mocks.pending.mockResolvedValue(null)
    // when
    render(<RegistrationPage />)
    // then
    expect(await screen.findByRole('alert')).toHaveTextContent('가입 정보가 없습니다')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('registration_failure_keeps_consents_for_retry_ko', async () => {
    // given
    const actor = userEvent.setup()
    mocks.pending.mockResolvedValue(registration)
    mocks.complete.mockRejectedValue(new AuthError(500))
    render(<RegistrationPage />)
    await actor.click(await screen.findByRole('checkbox', { name: '[필수] 이용약관' }))
    await actor.click(screen.getByRole('checkbox', { name: '[필수] 개인정보 수집·이용' }))
    // when
    await actor.click(screen.getByRole('button', { name: '동의하고 가입하기' }))
    // then
    expect(await screen.findByRole('alert')).toHaveTextContent('가입 요청을 완료하지 못했습니다')
    expect(screen.getByRole('checkbox', { name: '[필수] 이용약관' })).toBeChecked()
    expect(mocks.replace).not.toHaveBeenCalled()
  })
})
