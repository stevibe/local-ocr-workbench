import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

const markdownTagNames = new Set([
  ...(defaultSchema.tagNames || []),
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'colgroup',
  'col',
])

const markdownSchema = {
  ...defaultSchema,
  tagNames: Array.from(markdownTagNames),
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className', /^language-./]],
    col: [...(defaultSchema.attributes?.col || []), 'span'],
    colgroup: [...(defaultSchema.attributes?.colgroup || []), 'span'],
    div: [...(defaultSchema.attributes?.div || []), 'align'],
    p: [...(defaultSchema.attributes?.p || []), 'align'],
    table: [...(defaultSchema.attributes?.table || []), 'align'],
    td: [...(defaultSchema.attributes?.td || []), 'align', 'colSpan', 'rowSpan'],
    th: [...(defaultSchema.attributes?.th || []), 'align', 'colSpan', 'rowSpan'],
  },
}

export const markdownRemarkPlugins = [remarkGfm, remarkMath]
export const markdownRehypePlugins = [
  rehypeRaw,
  [rehypeSanitize, markdownSchema],
  rehypeKatex,
]
