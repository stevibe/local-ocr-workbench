import { useCallback, useEffect, useRef, useState } from 'react'
import { Settings2 } from 'lucide-react'
import 'katex/dist/katex.min.css'
import DocumentPanel from './components/DocumentPanel'
import ResultsPanel from './components/ResultsPanel'
import SettingsModal from './components/SettingsModal'
import {
  clearPersistedOcrSettings,
  DEFAULT_OCR_SETTINGS,
  getInitialOcrSettings,
  hasOcrSettingsOverride,
  normalizeOcrSettings,
  persistOcrSettings,
} from './config/ocr'
import { loadPdf, renderPdfPageToBlob } from './lib/document'
import { streamOcrMarkdown } from './lib/ocr-api'

function App() {
  const inputRef = useRef(null)
  const abortControllerRef = useRef(null)
  const abortReasonRef = useRef('idle')
  const ocrRequestIdRef = useRef(0)
  const pdfDocumentRef = useRef(null)
  const fileLoadIdRef = useRef(0)
  const pageRenderIdRef = useRef(0)

  const [documentFile, setDocumentFile] = useState(null)
  const [documentKind, setDocumentKind] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagePreviewUrl, setPagePreviewUrl] = useState('')
  const [activePageBlob, setActivePageBlob] = useState(null)
  const [markdown, setMarkdown] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isPreparingPage, setIsPreparingPage] = useState(false)
  const [error, setError] = useState('')
  const [ocrStats, setOcrStats] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [ocrSettings, setOcrSettings] = useState(() => getInitialOcrSettings())

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      pdfDocumentRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!pagePreviewUrl) {
      return undefined
    }

    return () => {
      URL.revokeObjectURL(pagePreviewUrl)
    }
  }, [pagePreviewUrl])

  useEffect(() => {
    if (
      documentKind !== 'pdf' ||
      !pdfDocumentRef.current ||
      !documentFile ||
      pageCount === 0
    ) {
      return undefined
    }

    let cancelled = false
    const renderId = ++pageRenderIdRef.current

    const renderPage = async () => {
      setIsPreparingPage(true)
      setError('')
      setOcrStats(null)

      try {
        const blob = await renderPdfPageToBlob(pdfDocumentRef.current, currentPage)

        if (cancelled || renderId !== pageRenderIdRef.current) {
          return
        }

        setActivePageBlob(blob)
        setPagePreviewUrl(URL.createObjectURL(blob))
      } catch (renderError) {
        if (cancelled || renderId !== pageRenderIdRef.current) {
          return
        }

        setActivePageBlob(null)
        setPagePreviewUrl('')
        setMarkdown('')
        setError(
          renderError instanceof Error
            ? renderError.message
            : 'Failed to render the selected PDF page.',
        )
      } finally {
        if (!cancelled && renderId === pageRenderIdRef.current) {
          setIsPreparingPage(false)
        }
      }
    }

    void renderPage()

    return () => {
      cancelled = true
    }
  }, [currentPage, documentFile, documentKind, pageCount])

  const stopActiveOcr = useCallback((reason = 'user') => {
    abortReasonRef.current = reason
    abortControllerRef.current?.abort()
  }, [])

  const runOcrForBlob = useCallback(
    async (blob) => {
      if (!blob) {
        return
      }

      stopActiveOcr('superseded')

      const requestId = ocrRequestIdRef.current + 1
      ocrRequestIdRef.current = requestId
      const abortController = new AbortController()

      abortControllerRef.current = abortController
      abortReasonRef.current = 'active'
      setIsLoading(true)
      setIsStreaming(true)
      setError('')
      setMarkdown('')
      setOcrStats(null)

      try {
        const result = await streamOcrMarkdown({
          blob,
          signal: abortController.signal,
          settings: ocrSettings,
          onChunk: (nextMarkdown) => {
            if (requestId === ocrRequestIdRef.current) {
              setMarkdown(nextMarkdown)
            }
          },
        })

        if (requestId === ocrRequestIdRef.current) {
          setMarkdown(result.markdown)
          setOcrStats(result.stats)
        }
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === 'AbortError') {
          if (requestId === ocrRequestIdRef.current && abortReasonRef.current === 'user') {
            setError('OCR stopped.')
          }

          return
        }

        if (requestId === ocrRequestIdRef.current) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The OCR request failed.',
          )
        }
      } finally {
        if (requestId === ocrRequestIdRef.current) {
          abortControllerRef.current = null
          abortReasonRef.current = 'idle'
          setIsLoading(false)
          setIsStreaming(false)
        }
      }
    },
    [ocrSettings, stopActiveOcr],
  )

  useEffect(() => {
    if (!activePageBlob || isPreparingPage) {
      return
    }

    void runOcrForBlob(activePageBlob)
  }, [activePageBlob, isPreparingPage, runOcrForBlob])

  const selectDocument = async (file) => {
    if (!file) {
      return
    }

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (!isImage && !isPdf) {
      setError('Choose an image or a PDF.')
      return
    }

    const loadId = fileLoadIdRef.current + 1
    fileLoadIdRef.current = loadId

    stopActiveOcr('superseded')
    pageRenderIdRef.current += 1
    setError('')
    setMarkdown('')
    setOcrStats(null)
    setDocumentFile(file)
    setCurrentPage(1)
    setActivePageBlob(null)
    setPagePreviewUrl('')

    if (isImage) {
      pdfDocumentRef.current?.destroy()
      pdfDocumentRef.current = null
      setDocumentKind('image')
      setPageCount(1)
      setIsPreparingPage(false)
      setActivePageBlob(file)
      setPagePreviewUrl(URL.createObjectURL(file))
      return
    }

    setDocumentKind('pdf')
    setPageCount(0)
    setIsPreparingPage(true)

    try {
      const nextPdfDocument = await loadPdf(file)

      if (loadId !== fileLoadIdRef.current) {
        nextPdfDocument.destroy()
        return
      }

      pdfDocumentRef.current?.destroy()
      pdfDocumentRef.current = nextPdfDocument
      setPageCount(nextPdfDocument.numPages)
      setCurrentPage(1)
    } catch (loadError) {
      if (loadId !== fileLoadIdRef.current) {
        return
      }

      pdfDocumentRef.current = null
      setDocumentKind(null)
      setDocumentFile(null)
      setActivePageBlob(null)
      setPagePreviewUrl('')
      setPageCount(0)
      setIsPreparingPage(false)
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to open the PDF.',
      )
    }
  }

  const handleFileChange = (fileOrEvent) => {
    const file =
      fileOrEvent instanceof File
        ? fileOrEvent
        : fileOrEvent?.target?.files?.[0] ?? null

    void selectDocument(file)
  }

  const canMoveBackward = documentKind === 'pdf' && currentPage > 1
  const canMoveForward = documentKind === 'pdf' && currentPage < pageCount
  const hasOverrides = hasOcrSettingsOverride(ocrSettings)
  const stats = [
    markdown
      ? {
          label: 'chars',
          value: markdown.length.toLocaleString(),
        }
      : null,
    ocrStats?.ttftMs != null
      ? {
          label: 'TTFT',
          value: `${(ocrStats.ttftMs / 1000).toFixed(2)}s`,
        }
      : null,
    ocrStats?.tokensPerSecond != null
      ? {
          label: 'tok/s',
          value: ocrStats.tokensPerSecond.toFixed(1),
        }
      : null,
  ].filter(Boolean)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(255,141,87,0.42),_transparent_68%)] blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(22,90,120,0.32),_transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/65 px-6 py-3.5 shadow-[0_30px_80px_rgba(28,34,45,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-12 items-center">
            <h1 className="text-xl font-semibold leading-none text-[var(--ink-strong)] sm:text-2xl">
              Local OCR Workbench
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {hasOverrides ? (
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Custom Settings
              </span>
            ) : null}
            <p className="text-sm font-medium text-[var(--muted)] sm:text-base">
              Model:
              {' '}
              <span className="text-[var(--ink-strong)]">{ocrSettings.model}</span>
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:bg-white"
              aria-label="Open OCR settings"
              title="OCR settings"
            >
              <Settings2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[2fr_3fr]">
          <DocumentPanel
            canMoveBackward={canMoveBackward}
            canMoveForward={canMoveForward}
            currentPage={currentPage}
            documentFile={documentFile}
            documentKind={documentKind}
            error={error}
            inputRef={inputRef}
            isPreparingPage={isPreparingPage}
            onFileChange={handleFileChange}
            onNextPage={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            onPageSelect={setCurrentPage}
            onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onSelectFile={() => inputRef.current?.click()}
            pageCount={pageCount}
            pagePreviewUrl={pagePreviewUrl}
          />

          <ResultsPanel
            isLoading={isLoading}
            isStreaming={isStreaming}
            markdown={markdown}
            onStop={() => stopActiveOcr('user')}
            stats={stats}
          />
        </section>
      </div>

      {isSettingsOpen ? (
        <SettingsModal
          defaults={DEFAULT_OCR_SETTINGS}
          hasOverrides={hasOverrides}
          onClose={() => setIsSettingsOpen(false)}
          onReset={() => {
            clearPersistedOcrSettings()
            setOcrSettings(normalizeOcrSettings(DEFAULT_OCR_SETTINGS))
            setIsSettingsOpen(false)
          }}
          onSave={(nextSettings) => {
            const normalizedSettings = normalizeOcrSettings(nextSettings)
            persistOcrSettings(normalizedSettings)
            setOcrSettings(normalizedSettings)
            setIsSettingsOpen(false)
          }}
          settings={ocrSettings}
        />
      ) : null}
    </main>
  )
}

export default App
