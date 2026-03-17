import { RotateCcw, Save, X } from 'lucide-react'
import { useState } from 'react'

function EnvBadge() {
  return (
    <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-[var(--ink-strong)]">
      .env
    </span>
  )
}

function SettingsModal({
  defaults,
  hasOverrides,
  onClose,
  onReset,
  onSave,
  settings,
}) {
  const [draft, setDraft] = useState(settings)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.36)] px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/60 bg-[rgba(255,250,245,0.96)] p-6 shadow-[0_30px_90px_rgba(28,34,45,0.16)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Settings</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              These values are loaded from
              {' '}
              <EnvBadge />
              . To persist changes for the project, update the
              {' '}
              <EnvBadge />
              {' '}
              file. Editing here only saves to this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--ink-strong)] transition hover:bg-white"
            aria-label="Close settings"
            title="Close settings"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--ink-strong)]">
              OCR endpoint
            </span>
            <input
              type="text"
              value={draft.endpoint}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  endpoint: event.target.value,
                }))
              }
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white/90 px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)]"
            />
            <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">
              Default from <EnvBadge />: {defaults.endpoint}
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--ink-strong)]">
              Model
            </span>
            <input
              type="text"
              value={draft.model}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  model: event.target.value,
                }))
              }
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white/90 px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)]"
            />
            <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">
              Default from <EnvBadge />: {defaults.model}
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--muted)]">
            {hasOverrides ? 'Using saved browser overrides.' : <>Using <EnvBadge /> defaults.</>}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:bg-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ink-strong)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Overrides
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
