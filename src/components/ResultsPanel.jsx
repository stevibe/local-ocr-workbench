import { Square } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { markdownRehypePlugins, markdownRemarkPlugins } from '../lib/markdown'

function ResultsPanel({ isLoading, isStreaming, markdown, onStop, stats }) {
  return (
    <div className="panel">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Output</p>
        </div>

        <div className="min-h-[2rem] text-sm text-[var(--muted)]">
          {isStreaming ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(245,158,11,0.18)] px-3 py-1 text-sm font-semibold text-[rgb(180,83,9)]">
              <span className="h-3 w-3 animate-spin rounded-full border border-[var(--accent)] border-t-transparent" />
              <span>Streaming</span>
            </span>
          ) : stats.length > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-end gap-1.5">
                  <span className="text-2xl font-bold leading-none text-black">{stat.value}</span>
                  <span className="text-sm text-black">{stat.label}</span>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <p>Waiting for text...</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex-1">
        <div className="min-h-[28rem] p-1">
          {markdown ? (
            <div className="markdown-preview">
              <ReactMarkdown
                remarkPlugins={markdownRemarkPlugins}
                rehypePlugins={markdownRehypePlugins}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : isLoading ? (
            <div className="flex h-full min-h-[24rem] items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-full bg-[rgba(245,158,11,0.14)] px-4 py-2 text-sm font-semibold text-[rgb(180,83,9)]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  <span>Loading</span>
                </div>
                <button
                  type="button"
                  onClick={onStop}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(29,41,51,0.14)] bg-white/90 text-[var(--ink-strong)] shadow-[0_8px_18px_rgba(29,41,51,0.08)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  aria-label="Stop OCR"
                  title="Stop OCR"
                >
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[24rem] items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 text-center text-sm leading-6 text-[var(--muted)]">
              OCR results will appear here after a file is selected.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultsPanel
