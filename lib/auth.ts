export interface AuthUser {
  id: string
  name: string
  email: string | null
  profileImgUrl: string | null
}

export interface RegistrationTerm {
  id: string
  title: string
  version: string
  content: string
  required: boolean
}

export interface PendingRegistration {
  name: string
  provider: 'GOOGLE' | 'GITHUB'
  terms: RegistrationTerm[]
}

export interface Consent {
  id: string
  version: string
  agreed: boolean
}

const API_PREFIX = '/backend'
let accessToken: string | null = null
let refreshRequest: Promise<void> | null = null
let sessionVersion = 0
let pendingLogouts = 0

/** HTTP 상태를 구분하되 서버 응답의 인증 정보는 오류 메시지에 포함하지 않는다. */
export class AuthError extends Error {
  constructor(public status: number) {
    super('인증 요청을 처리하지 못했습니다.')
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init, credentials: 'same-origin', cache: 'no-store',
  })
  if (!response.ok) throw new AuthError(response.status)
  return response
}

async function csrfPost(path: string, body?: unknown): Promise<Response> {
  const csrfResponse = await request('/auth/csrf')
  const csrf: { headerName: string; token: string } = await csrfResponse.json()
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function refresh(): Promise<void> {
  if (pendingLogouts > 0) throw new AuthError(401)
  if (!refreshRequest) {
    const version = sessionVersion
    refreshRequest = (async () => {
      const response = await csrfPost('/auth/refresh')
      const data: { accessToken: string } = await response.json()
      if (version !== sessionVersion || pendingLogouts > 0) throw new AuthError(401)
      if (!data.accessToken) throw new AuthError(401)
      accessToken = data.accessToken
    })().catch(error => {
      if (version === sessionVersion) accessToken = null
      throw error
    }).finally(() => { refreshRequest = null })
  }
  return refreshRequest
}

/** 401이면 이미 갱신된 토큰을 재사용하거나 한 번 갱신한다. 로그아웃 이전 요청은 재시도하지 않는다. */
export async function authenticatedRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const version = sessionVersion
  if (!accessToken) await refresh()
  const send = () => {
    if (version !== sessionVersion || pendingLogouts > 0) throw new AuthError(401)
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    return request(path, { ...init, headers })
  }
  const requestToken = accessToken
  try {
    return await send()
  } catch (error) {
    if (version !== sessionVersion || pendingLogouts > 0) throw new AuthError(401)
    if (!(error instanceof AuthError) || error.status !== 401) throw error
    if (!accessToken || accessToken === requestToken) await refresh()
    return send()
  }
}

/** HttpOnly 갱신 쿠키로 인증을 복원하고 현재 사용자 정보를 조회한다. */
export async function restoreSession(): Promise<AuthUser> {
  const response = await authenticatedRequest('/users/me')
  const user: AuthUser = await response.json()
  if (!user.id || !user.name) throw new AuthError(502)
  return user
}

/** 임시 가입 정보와 약관을 조회한다. 구버전 백엔드의 404 또는 기존 회원의 204는 가입 대상이 아니다. */
export async function getPendingRegistration(): Promise<PendingRegistration | null> {
  let response: Response
  try {
    response = await request('/auth/registration')
  } catch (error) {
    if (error instanceof AuthError && error.status === 404) return null
    throw error
  }
  if (response.status === 204) return null
  const registration: PendingRegistration = await response.json()
  if (!registration.terms?.length || !registration.terms.some(term => term.required)) {
    throw new AuthError(502)
  }
  return registration
}

/** 약관 ID와 버전별 동의를 제출한다. 가입 결과는 백엔드가 쿠키로 인증한다. */
export async function completeRegistration(consents: Consent[]): Promise<void> {
  await csrfPost('/auth/registration', { consents })
}

/** 이전 인증 요청을 무효화하고 갱신을 차단한 상태에서 백엔드 갱신 토큰을 폐기한다. */
export async function logout(): Promise<void> {
  sessionVersion += 1
  pendingLogouts += 1
  accessToken = null
  try {
    await csrfPost('/auth/logout')
  } finally {
    pendingLogouts -= 1
  }
}
