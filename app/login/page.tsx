import type { Metadata } from 'next'
import { AuthenticatedLogin } from '@/components/authenticated-login'

export const metadata: Metadata = {
  title: '로그인 — Work Manager',
  description: 'Work Manager에서 프로젝트와 작업을 한곳에서 관리하세요.',
}

/** 워크스페이스의 로그인 화면을 제공한다. */
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return <AuthenticatedLogin loginError={params.error !== undefined} />
}
