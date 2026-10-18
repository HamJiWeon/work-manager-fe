import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const user = { id: 'user-1', name: '사용자', email: 'user@example.com', profileImgUrl: null }
const csrf = { headerName: 'X-XSRF-TOKEN', token: 'csrf-value' }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })
const fetchMock = vi.fn()

beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset() })
afterEach(() => vi.unstubAllGlobals())

describe('auth_client', () => {
  it('restores_session_using_csrf_and_refresh_cookie_ok', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'access' })).mockResolvedValueOnce(json(user))
    const { restoreSession } = await import('@/lib/auth')
    // when
    const result = await restoreSession()
    // then
    expect(result).toEqual(user)
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/backend/auth/refresh', expect.objectContaining({ method: 'POST', credentials: 'same-origin', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-value' }) }))
    const headers = fetchMock.mock.calls[2][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer access')
  })

  it('concurrent_restores_share_refresh_request_ok', async () => {
    // given
    fetchMock.mockImplementation((url: string) => Promise.resolve(json(url.endsWith('/csrf') ? csrf : url.endsWith('/refresh') ? { accessToken: 'access' } : user)))
    const { restoreSession } = await import('@/lib/auth')
    // when
    await Promise.all([restoreSession(), restoreSession()])
    // then
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/refresh'))).toHaveLength(1)
  })

  it('expired_access_token_is_refreshed_once_ok', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'old' }))
      .mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json(csrf))
      .mockResolvedValueOnce(json({ accessToken: 'new' })).mockResolvedValueOnce(json(user))
    const { restoreSession } = await import('@/lib/auth')
    // when
    expect(await restoreSession()).toEqual(user)
    // then
    expect(fetchMock).toHaveBeenCalledTimes(6)
    expect((fetchMock.mock.calls[5][1].headers as Headers).get('Authorization')).toBe('Bearer new')
  })

  it('late_unauthorized_response_reuses_refreshed_token_ok', async () => {
    // given
    const { restoreSession } = await import('@/lib/auth')
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'old' })).mockResolvedValueOnce(json(user))
    await restoreSession()
    fetchMock.mockClear()
    fetchMock.mockImplementation((url: string) => Promise.resolve(json(url.endsWith('/csrf') ? csrf : url.endsWith('/refresh') ? { accessToken: 'redundant' } : user)))
    let resolveDelayed!: (response: Response) => void
    const delayedResponse = new Promise<Response>(resolve => { resolveDelayed = resolve })
    fetchMock.mockResolvedValueOnce(json({}, 401)).mockReturnValueOnce(delayedResponse)
      .mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'new' }))
      .mockResolvedValueOnce(json(user)).mockResolvedValueOnce(json(user))
    // when
    const first = restoreSession()
    const second = restoreSession()
    await expect(first).resolves.toEqual(user)
    resolveDelayed(json({}, 401))
    // then
    await expect(second).resolves.toEqual(user)
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/refresh'))).toHaveLength(1)
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/csrf'))).toHaveLength(1)
    expect((fetchMock.mock.calls.at(-1)![1].headers as Headers).get('Authorization')).toBe('Bearer new')
  })

  it('missing_refresh_cookie_does_not_authenticate_ko', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({}, 401))
    const { restoreSession } = await import('@/lib/auth')
    // when / then
    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('logout_clears_memory_and_next_restore_requires_refresh_ok', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'access' })).mockResolvedValueOnce(json(user))
      .mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({}, 401))
    const { restoreSession, logout } = await import('@/lib/auth')
    await restoreSession()
    // when
    await logout()
    // then
    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    expect(fetchMock.mock.calls[4][0]).toBe('/backend/auth/logout')
  })

  it('late_refresh_after_logout_does_not_restore_session_ko', async () => {
    // given
    let resolveRefresh!: (response: Response) => void
    const delayedRefresh = new Promise<Response>(resolve => { resolveRefresh = resolve })
    const { restoreSession, logout } = await import('@/lib/auth')
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/csrf')) return Promise.resolve(json(csrf))
      if (url.endsWith('/refresh')) return delayedRefresh
      if (url.endsWith('/logout')) return Promise.resolve(new Response(null, { status: 204 }))
      return Promise.resolve(json(user))
    })
    const restoration = restoreSession()
    const rejectedRestoration = expect(restoration).rejects.toMatchObject({ status: 401 })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/backend/auth/refresh', expect.anything()))
    // when
    await logout()
    resolveRefresh(json({ accessToken: 'stale-access' }))
    // then
    await rejectedRestoration
    fetchMock.mockImplementation((url: string) => Promise.resolve(url.endsWith('/csrf') ? json(csrf) : json({}, 401)))
    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/users/me'))).toBe(false)
  })

  it('registration_posts_versioned_consents_ok', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(new Response(null, { status: 204 }))
    const { completeRegistration } = await import('@/lib/auth')
    const consents = [{ id: 'terms', version: 'v1', agreed: true }]
    // when
    await completeRegistration(consents)
    // then
    expect(fetchMock).toHaveBeenLastCalledWith('/backend/auth/registration', expect.objectContaining({ body: JSON.stringify({ consents }) }))
  })

  it('missing_registration_api_allows_existing_login_ok', async () => {
    // given
    fetchMock.mockResolvedValue(json({}, 404))
    const { getPendingRegistration } = await import('@/lib/auth')
    // when / then
    expect(await getPendingRegistration()).toBeNull()
  })

  it('empty_terms_do_not_allow_registration_ko', async () => {
    // given
    fetchMock.mockResolvedValue(json({ name: '사용자', provider: 'GOOGLE', terms: [] }))
    const { getPendingRegistration } = await import('@/lib/auth')
    // when / then
    await expect(getPendingRegistration()).rejects.toMatchObject({ status: 502 })
  })
})

describe('auth_response_validation', () => {
  it.each([{ id: '', name: '사용자' }, { id: 'user-1', name: '' }])('invalid_user_response_is_rejected_ko_%#', async invalidUser => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'access' })).mockResolvedValueOnce(json(invalidUser))
    const { restoreSession } = await import('@/lib/auth')
    // when / then
    await expect(restoreSession()).rejects.toMatchObject({ status: 502 })
  })

  it('missing_access_token_is_rejected_ko', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({}))
    const { restoreSession } = await import('@/lib/auth')
    // when / then
    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('non_authentication_error_is_not_retried_ko', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'access' })).mockResolvedValueOnce(json({}, 503))
    const { restoreSession } = await import('@/lib/auth')
    // when / then
    await expect(restoreSession()).rejects.toMatchObject({ status: 503 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('second_unauthorized_response_is_not_retried_ko', async () => {
    // given
    fetchMock.mockResolvedValueOnce(json(csrf)).mockResolvedValueOnce(json({ accessToken: 'old' }))
      .mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json(csrf))
      .mockResolvedValueOnce(json({ accessToken: 'new' })).mockResolvedValueOnce(json({}, 401))
    const { restoreSession } = await import('@/lib/auth')
    // when / then
    await expect(restoreSession()).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('existing_user_registration_returns_null_ok', async () => {
    // given
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { getPendingRegistration } = await import('@/lib/auth')
    // when / then
    await expect(getPendingRegistration()).resolves.toBeNull()
  })

  it('registration_server_error_is_propagated_ko', async () => {
    // given
    fetchMock.mockResolvedValue(json({}, 500))
    const { getPendingRegistration } = await import('@/lib/auth')
    // when / then
    await expect(getPendingRegistration()).rejects.toMatchObject({ status: 500 })
  })

  it.each([{}, { terms: [{ required: false }] }])('registration_without_required_terms_is_rejected_ko_%#', async data => {
    // given
    fetchMock.mockResolvedValue(json(data))
    const { getPendingRegistration } = await import('@/lib/auth')
    // when / then
    await expect(getPendingRegistration()).rejects.toMatchObject({ status: 502 })
  })

  it('valid_pending_registration_is_returned_ok', async () => {
    // given
    const registration = { name: '사용자', provider: 'GOOGLE', terms: [{ id: 'terms', title: '이용약관', version: 'v1', content: '약관', required: true }] }
    fetchMock.mockResolvedValue(json(registration))
    const { getPendingRegistration } = await import('@/lib/auth')
    // when / then
    await expect(getPendingRegistration()).resolves.toEqual(registration)
  })
})
