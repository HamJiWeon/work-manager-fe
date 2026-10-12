export const MARKDOWN_ACTIONS = [
  { id: 'bold', label: '굵게', symbol: 'B', shortcut: 'B' },
  { id: 'italic', label: '기울임', symbol: 'I', shortcut: 'I' },
  { id: 'code', label: '인라인 코드', symbol: '<>', shortcut: 'E' },
  { id: 'codeBlock', label: '코드 블록', symbol: '{ }', shortcut: 'Shift+E' },
  { id: 'link', label: '링크', symbol: '↗', shortcut: 'K' },
  { id: 'heading', label: '제목', symbol: 'H', shortcut: 'Shift+H' },
  { id: 'bullet', label: '글머리 목록', symbol: '•', shortcut: 'Shift+U' },
  { id: 'numbered', label: '번호 목록', symbol: '1.', shortcut: 'Shift+O' },
  { id: 'quote', label: '인용', symbol: '❝', shortcut: 'Shift+Q' },
] as const
export type MarkdownAction = typeof MARKDOWN_ACTIONS[number]['id']
export interface EditorSelection { value: string; start: number; end: number }

/** 선택 영역에 서식을 적용하거나 기존 서식을 해제하고 새 선택 범위를 반환한다. 빈 선택은 마커 사이에 커서를 놓는다. */
export function formatMarkdown(selection: EditorSelection, action: MarkdownAction): EditorSelection {
  const { value, start, end } = selection
  const selected = value.slice(start, end)
  const wrappers: Partial<Record<MarkdownAction, [string, string]>> = {
    bold: ['**', '**'], italic: ['*', '*'], code: ['`', '`'], codeBlock: ['```\n', '\n```'], link: ['[', '](https://)'],
  }
  const wrapper = wrappers[action]
  if (wrapper) {
    const [before, after] = wrapper
    if (action !== 'link' && value.slice(Math.max(0, start - before.length), start) === before && value.slice(end, end + after.length) === after) {
      return { value: value.slice(0, start - before.length) + selected + value.slice(end + after.length), start: start - before.length, end: end - before.length }
    }
    return { value: value.slice(0, start) + before + selected + after + value.slice(end), start: start + before.length, end: end + before.length }
  }
  const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1
  const lineEndIndex = value.indexOf('\n', end > start && value[end - 1] === '\n' ? end - 1 : end)
  const lineEnd = lineEndIndex < 0 ? value.length : lineEndIndex
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const prefixes: Partial<Record<MarkdownAction, string>> = { heading: '## ', bullet: '- ', quote: '> ' }
  const prefix = prefixes[action] ?? ''
  const pattern = action === 'numbered' ? /^\d+\. / : null
  const removing = lines.every(line => pattern ? pattern.test(line) : line.startsWith(prefix))
  const updated = lines.map((line, index) => {
    const marker = action === 'numbered' ? `${index + 1}. ` : prefix
    return removing ? (pattern ? line.replace(pattern, '') : line.slice(marker.length)) : marker + line
  }).join('\n')
  return { value: value.slice(0, lineStart) + updated + value.slice(lineEnd), start: lineStart, end: lineStart + updated.length }
}
