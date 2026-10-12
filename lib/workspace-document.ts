import type { SavedCardDocument } from '@/lib/card-document'

export const WORKSPACE_DOCUMENT_CHANGE_EVENT = 'work-manager:workspace-document-change'

function getStorageKey(projectId: string, documentId: string) {
  return `work-manager:workspace-document:${encodeURIComponent(projectId)}:${encodeURIComponent(documentId)}`
}

/** 프로젝트와 고정 문서 ID로 제목과 Markdown을 복원한다. 손상된 데이터 또는 저장소 접근 실패는 빈 문서로 처리한다. */
export function readWorkspaceDocument(projectId: string, documentId: string): SavedCardDocument | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(getStorageKey(projectId, documentId)) ?? 'null')
    if (typeof value === 'object' && value !== null && 'title' in value && typeof value.title === 'string' && 'content' in value && typeof value.content === 'string') return { title: value.title, content: value.content }
  } catch { return null }
  return null
}

/** 프로젝트별 문서를 저장하고 목록 구독자에게 변경을 알린다. 저장 오류는 편집기가 처리하도록 전달한다. */
export function saveWorkspaceDocument(projectId: string, documentId: string, document: SavedCardDocument): void {
  localStorage.setItem(getStorageKey(projectId, documentId), JSON.stringify(document))
  window.dispatchEvent(new Event(WORKSPACE_DOCUMENT_CHANGE_EVENT))
}
