import { ImageUp } from 'lucide-react'

function DocumentPanel({
  canMoveBackward,
  canMoveForward,
  currentPage,
  documentFile,
  documentKind,
  error,
  inputRef,
  isPreparingPage,
  onFileChange,
  onNextPage,
  onPageSelect,
  onPreviousPage,
  onSelectFile,
  pageCount,
  pagePreviewUrl,
}) {
  return (
    <div className="panel h-auto self-start">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="eyebrow">Input</p>
        {documentFile ? (
          <span className="rounded-full bg-white/85 px-3 py-1.5 text-sm text-[var(--ink-strong)]">
            {documentFile.name}
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        onChange={onFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={onSelectFile}
        onDrop={(event) => {
          event.preventDefault()
          onFileChange(event.dataTransfer.files?.[0] ?? null)
        }}
        onDragOver={(event) => event.preventDefault()}
        className="relative flex min-h-[28rem] w-full flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-[var(--line-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,247,241,0.95))] p-5 text-center transition hover:border-[var(--accent)]"
      >
        {pagePreviewUrl ? (
          <img
            src={pagePreviewUrl}
            alt={documentFile?.name || 'Selected upload preview'}
            className="max-h-[26rem] w-full rounded-[1.25rem] object-contain shadow-[0_20px_45px_rgba(44,38,32,0.14)]"
          />
        ) : (
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <ImageUp className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Drop a file here or click to browse.
            </p>
          </div>
        )}

        {isPreparingPage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,250,245,0.78)] backdrop-blur-[2px]">
            <div className="rounded-full bg-[rgba(22,90,120,0.14)] px-4 py-2 text-sm font-semibold text-[rgb(22,90,120)] shadow-[0_10px_30px_rgba(22,90,120,0.12)]">
              Preparing page...
            </div>
          </div>
        ) : null}
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {documentKind === 'pdf' ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 p-1">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={!canMoveBackward || isPreparingPage}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Prev
            </button>
            <label className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink-strong)]">
              <span className="sr-only">Jump to page</span>
              <select
                value={currentPage}
                onChange={(event) => onPageSelect(Number(event.target.value))}
                disabled={isPreparingPage}
                className="bg-transparent pr-6 text-sm font-semibold text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed"
              >
                {Array.from({ length: pageCount }, (_, index) => {
                  const page = index + 1
                  return (
                    <option key={page} value={page}>
                      {page} / {pageCount}
                    </option>
                  )
                })}
              </select>
            </label>
            <button
              type="button"
              onClick={onNextPage}
              disabled={!canMoveForward || isPreparingPage}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
      </div>

      {error ? (
        <div className="mt-4 rounded-[1.25rem] border border-[rgba(182,51,28,0.15)] bg-[rgba(182,51,28,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default DocumentPanel
