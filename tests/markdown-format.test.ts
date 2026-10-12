import { describe, expect, it } from 'vitest'
import { formatMarkdown } from '@/lib/markdown-editor'

describe('markdown_format', () => {
  it('toggle_existing_heading_and_numbered_lines_ok', () => {
    // given / when
    const heading = formatMarkdown({ value: 'intro\n## title\nend', start: 9, end: 14 }, 'heading')
    const numbered = formatMarkdown({ value: '1. one\n2. two\n', start: 0, end: 14 }, 'numbered')
    // then
    expect(heading.value).toBe('intro\ntitle\nend')
    expect(numbered.value).toBe('one\ntwo\n')
  })
})
