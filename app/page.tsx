import { OAuthCallback } from '@/components/oauth-callback'

/** 기본 주소에서도 OAuth 상태와 인증을 확인해 가입 또는 워크스페이스로 이동한다. */
export default function Page() {
  return <OAuthCallback />
}
