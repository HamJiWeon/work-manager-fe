export const PREVIEW_STORAGE_USER = 'preview'

/** 사용자 ID와 자료 종류를 분리해 키를 만들며 이전 공용 키는 조회하지 않는다. */
export function userStoragePrefix(userId: string, category: string): string {
  if (!userId.trim()) throw new Error('저장소 사용자 정보가 필요합니다.')
  return `work-manager:user:${encodeURIComponent(userId)}:${category}:`
}
