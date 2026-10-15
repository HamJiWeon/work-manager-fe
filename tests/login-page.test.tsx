import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/components/login-page'

describe('login_page', () => {
  it('oauth_failure_shows_retry_guidance_ok', () => {
    // given / when
    render(<LoginPage backendUrl="/backend" loginError />)
    // then
    expect(screen.getByRole('alert')).toHaveTextContent('소셜 인증을 완료하지 못했습니다')
    expect(screen.getByRole('link', { name: 'Google로 계속하기' })).toHaveAttribute('href', '/backend/oauth2/authorization/google')
  })

  it('social_login_links_use_backend_authorization_endpoints_ok', () => {
    // given
    const backendUrl = 'https://api.example.com'
    // when
    render(<LoginPage backendUrl={backendUrl} />)
    // then
    expect(screen.getByRole('link', { name: 'Google로 계속하기' })).toHaveAttribute('href', `${backendUrl}/oauth2/authorization/google`)
    expect(screen.getByRole('link', { name: 'GitHub로 계속하기' })).toHaveAttribute('href', `${backendUrl}/oauth2/authorization/github`)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '워크스페이스 둘러보기' })).not.toBeInTheDocument()
  })

  it('backend_trailing_slash_is_normalized_ok', () => {
    // given / when
    render(<LoginPage backendUrl="http://localhost:8080/" />)
    // then
    expect(screen.getByRole('link', { name: 'Google로 계속하기' })).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/google')
    expect(screen.getByRole('link', { name: 'GitHub로 계속하기' })).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/github')
  })
})
