import { useState, type FormEvent } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Plus } from 'lucide-react'
import type { BoardItem } from '@/lib/board'

interface BoardCreateDialogProps {
  onCreateBoard: (board: BoardItem) => void
}

/** 보드 생성 입력을 검증하고 전달하며 닫을 때 초안을 초기화한다. */
export function BoardCreateDialog({ onCreateBoard }: BoardCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setTitle('')
      setDescription('')
      setError('')
    }
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    onCreateBoard({ id: crypto.randomUUID(), name: title.trim(), description: description.trim(), progress: 0 })
    handleOpenChange(false)
  }

  return <Dialog.Root open={open} onOpenChange={handleOpenChange}>
    <Dialog.Trigger className="board-add-button"><Plus size={15} aria-hidden="true" />보드 추가</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="board-dialog-backdrop" />
      <Dialog.Popup className="board-dialog">
        <Dialog.Title className="board-dialog-title">보드 추가</Dialog.Title>
        <Dialog.Description className="board-dialog-description">새 보드의 제목과 설명을 입력하세요.</Dialog.Description>
        <form onSubmit={handleSubmit}>
          <label htmlFor="board-title">Title <span>(필수)</span></label>
          <input id="board-title" value={title} onChange={event => { setTitle(event.target.value); setError('') }} placeholder="보드 제목" aria-invalid={!!error} aria-describedby={error ? 'board-create-error' : undefined} />
          <label htmlFor="board-description">Description</label>
          <textarea id="board-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="보드에 대한 설명" rows={4} />
          {error && <p id="board-create-error" role="alert" className="board-create-error">{error}</p>}
          <div className="board-dialog-actions"><Dialog.Close type="button">취소</Dialog.Close><button type="submit" className="board-create-button">생성</button></div>
        </form>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
}
