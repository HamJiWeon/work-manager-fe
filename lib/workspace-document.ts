import { PREVIEW_STORAGE_USER, userStoragePrefix } from '@/lib/user-storage'
import type { SavedCardDocument } from '@/lib/card-document'

export const WORKSPACE_DOCUMENT_CHANGE_EVENT = 'work-manager:workspace-document-change'

function getStorageKey(projectId: string, documentId: string, userId: string) {
  return `${userStoragePrefix(userId, 'workspace-document')}${encodeURIComponent(projectId)}:${encodeURIComponent(documentId)}`
}

/** 사용자·프로젝트·고정 문서 ID로 제목과 Markdown을 복원한다. 손상된 데이터 또는 저장소 접근 실패는 빈 문서로 처리한다. */
export function readWorkspaceDocument(projectId: string, documentId: string, userId = PREVIEW_STORAGE_USER): SavedCardDocument | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(getStorageKey(projectId, documentId, userId)) ?? 'null')
    if (typeof value === 'object' && value !== null && 'title' in value && typeof value.title === 'string' && 'content' in value && typeof value.content === 'string') return { title: value.title, content: value.content }
  } catch { return null }
  return null
}

/** 사용자별 프로젝트 문서를 저장하고 목록 구독자에게 변경을 알린다. 저장 오류는 편집기가 처리하도록 전달한다. */
export function saveWorkspaceDocument(projectId: string, documentId: string, document: SavedCardDocument, userId = PREVIEW_STORAGE_USER): void {
  localStorage.setItem(getStorageKey(projectId, documentId, userId), JSON.stringify(document))
  window.dispatchEvent(new Event(WORKSPACE_DOCUMENT_CHANGE_EVENT))
}
