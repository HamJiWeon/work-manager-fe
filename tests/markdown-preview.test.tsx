import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownPreview } from '@/components/markdown-preview'

describe('markdown_preview', () => {
  it('render_lists_quote_separator_and_inline_styles_ok', () => {
    // given
    const content = '## 제목\r\n\r\n*기울임*\n---\n3. 세 번째\n4. 네 번째\n\n- 항목\n\n> 인용\n```\n코드\n```'
    // when
    render(<MarkdownPreview content={content} />)
    // then
    expect(screen.getByRole('heading', { name: '제목', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('기울임').tagName).toBe('EM')
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(screen.getByText('세 번째').closest('ol')).toHaveAttribute('start', '3')
    expect(screen.getByText('항목').closest('ul')).toBeInTheDocument()
    expect(screen.getByText('인용').tagName).toBe('BLOCKQUOTE')
    expect(screen.getByText('코드').tagName).toBe('CODE')
  })

  it('compact_links_are_not_interactive_and_empty_content_ok', () => {
    // given / when
    const view = render(<MarkdownPreview compact content={'[문서](https://example.com)\n[위험](javascript:alert)\n```\n닫히지 않은 코드'} />)
    // then
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('문서')).toBeInTheDocument()
    expect(screen.getByText('닫히지 않은 코드').tagName).toBe('CODE')
    // when
    view.rerender(<MarkdownPreview compact content={'\n '} />)
    // then
    expect(screen.getByText('작성된 내용이 없습니다.')).toBeInTheDocument()
  })
})
