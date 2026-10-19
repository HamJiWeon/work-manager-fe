'use client'

import { createContext, useContext } from 'react'
import { PREVIEW_STORAGE_USER } from '@/lib/user-storage'

export const StorageUserContext = createContext(PREVIEW_STORAGE_USER)

/** 인증 화면에서 전달한 사용자 ID를 사용하고 독립적인 예시 컴포넌트는 예시 저장소를 사용한다. */
export function useStorageUserId(): string {
  return useContext(StorageUserContext)
}
