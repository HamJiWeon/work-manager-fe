"use client"

import { useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { formatMarkdown, MARKDOWN_ACTIONS, type EditorSelection, type MarkdownAction } from '@/lib/markdown-editor'

/** Markdown의 선택 영역과 편집 이력을 관리하고 Mac·Windows의 서식 및 저장 단축키를 처리한다. */
export function useMarkdownEditor(initialValue: string, onSave: (value: string) => void) {
  const [draft, setDraft] = useState(initialValue)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const pendingSelection = useRef<EditorSelection | null>(null)
  const undo = useRef<EditorSelection[]>([])
  const redo = useRef<EditorSelection[]>([])
  const current = useRef<EditorSelection>({ value: initialValue, start: 0, end: 0 })
  useLayoutEffect(() => {
    const selection = pendingSelection.current
    if (!selection || !textarea.current) return
    textarea.current.focus()
    textarea.current.setSelectionRange(selection.start, selection.end)
    pendingSelection.current = null
  }, [draft])
  const getSelection = (): EditorSelection => ({ value: draft, start: textarea.current?.selectionStart ?? 0, end: textarea.current?.selectionEnd ?? 0 })
  const apply = (next: EditorSelection) => {
    current.current = next
    pendingSelection.current = next
    setDraft(next.value)
  }
  const handleFormat = (action: MarkdownAction) => {
    const selection = getSelection()
    undo.current.push(selection)
    redo.current = []
    apply(formatMarkdown(selection, action))
  }
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    undo.current.push(current.current)
    redo.current = []
    const element = event.currentTarget
    current.current = { value: element.value, start: element.selectionStart, end: element.selectionEnd }
    setDraft(element.value)
  }
  const handleSelectionChange = () => { current.current = getSelection() }
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || !(event.metaKey || event.ctrlKey) || event.altKey) return
    const key = event.key.toLowerCase()
    if (key === 's') { event.preventDefault(); onSave(draft); return }
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      const redoing = event.shiftKey || key === 'y'
      const source = redoing ? redo : undo
      const target = redoing ? undo : redo
      const next = source.current.pop()
      if (next) { target.current.push(getSelection()); apply(next) }
      return
    }
    const shortcut = `${event.shiftKey ? 'Shift+' : ''}${key.toUpperCase()}`
    const action = MARKDOWN_ACTIONS.find(item => item.shortcut === shortcut)
    if (action) { event.preventDefault(); handleFormat(action.id) }
  }
  const handleReset = (value: string) => {
    undo.current = []
    redo.current = []
    current.current = { value, start: 0, end: 0 }
    pendingSelection.current = null
    setDraft(value)
  }
  return { draft, textarea, handleFormat, handleChange, handleKeyDown, handleSelectionChange, handleReset }
}
