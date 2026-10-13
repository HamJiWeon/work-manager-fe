export interface BoardItem {
  id: string
  name: string
  description: string
  progress: number
}

export const SAMPLE_BOARD_ITEMS: BoardItem[] = [
  { id: 'user', name: 'User', description: '사용자 정보 조회 및 프로필 관리', progress: 50 },
  { id: 'login', name: 'Login', description: '로그인 및 로그아웃', progress: 100 },
  { id: 'team', name: 'Team', description: '팀 생성 및 멤버 관리', progress: 0 },
]
