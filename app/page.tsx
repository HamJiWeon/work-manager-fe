import { redirect } from 'next/navigation'

/** 기본 주소로 접속하면 로그인 페이지로 이동한다. */
export default function Page() {
  redirect('/login')
}
