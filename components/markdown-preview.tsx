import { Fragment, type ReactNode } from 'react'

function renderInline(text: string, interactiveLinks: boolean): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link && /^(https?:\/\/|mailto:|#)/i.test(link[2])) return interactiveLinks ? <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a> : <span key={index} className="markdown-link">{link[1]}</span>
    return <Fragment key={index}>{part}</Fragment>
  })
}

/** Markdown의 제목, 목록, 인용, 코드와 인라인 서식을 안전한 React 요소로 표시한다. HTML은 실행하지 않으며 카드용 미리보기에서는 링크를 비활성 텍스트로 표시한다. */
export function MarkdownPreview({ content, compact = false }: { content: string; compact?: boolean }) {
  const formatInline = (text: string) => renderInline(text, !compact)
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const key = index
    if (!line.trim()) { index++; continue }
    if (/^\s*```/.test(line)) {
      const code: string[] = []
      index++
      while (index < lines.length && !/^\s*```/.test(lines[index])) code.push(lines[index++])
      index++
      blocks.push(<pre key={key}><code>{code.join('\n')}</code></pre>)
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      const Tag = `h${heading[1].length}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      blocks.push(<Tag key={key}>{formatInline(heading[2])}</Tag>)
    } else if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push(<hr key={key} />)
    } else if (/^\s*([-+*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const pattern = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-+*]\s+(.*)$/
      const items: ReactNode[] = []
      while (index < lines.length) {
        const match = lines[index].match(pattern)
        if (!match) break
        items.push(<li key={index}>{formatInline(match[1])}</li>)
        index++
      }
      blocks.push(ordered ? <ol key={key} start={Number(line.match(/\d+/)?.[0])}>{items}</ol> : <ul key={key}>{items}</ul>)
      continue
    } else if (/^>\s?/.test(line)) {
      blocks.push(<blockquote key={key}>{formatInline(line.replace(/^>\s?/, ''))}</blockquote>)
    } else {
      blocks.push(<p key={key}>{formatInline(line)}</p>)
    }
    index++
  }
  return <div className={`markdown-preview ${compact ? 'markdown-preview-compact' : ''}`}>{blocks.length ? blocks : <p className="markdown-empty">{compact ? '작성된 내용이 없습니다.' : '작성된 내용이 없습니다. 편집을 눌러 내용을 추가하세요.'}</p>}</div>
}
