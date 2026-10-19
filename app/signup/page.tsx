import type { Metadata } from 'next'
import { RegistrationPage } from '@/components/registration-page'

export const metadata: Metadata = { title: '회원가입 — Work Manager' }

/** 소셜 인증을 마친 신규 사용자의 약관 동의 화면을 제공한다. */
export default function Page() {
  return <RegistrationPage />
}
