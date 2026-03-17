export const DEFAULT_OCR_SETTINGS = Object.freeze({
  baseUrl: import.meta.env.VITE_OCR_BASE_URL || '/api/proxy',
  endpoint: import.meta.env.VITE_OCR_ENDPOINT || '/api/generate',
  model: import.meta.env.VITE_OCR_MODEL || 'glm-ocr',
})

export const OCR_SETTINGS_STORAGE_KEY = 'local-ocr-workbench.ocr-settings'

export const OCR_PROMPT = `Extract every visible piece of text from this page as faithfully as possible.
Do not omit titles, subtitles, headers, footers, labels, captions, footnotes, notes, side text, or text near or around tables.
Preserve the document structure and formatting semantics whenever they are visually identifiable:
- titles and section headings
- subtitles
- paragraphs
- ordered and unordered lists
- bold text
- italic text
- code blocks
- table content
Respond in Markdown as much as possible.
Use standard Markdown for headings, paragraphs, lists, emphasis, strong text, and code blocks whenever Markdown can represent them cleanly.
Use HTML only when Markdown cannot preserve the layout well enough.
Render tables with HTML table tags instead of Markdown tables.
If text is visually bold or italic, preserve that with Markdown when possible, otherwise use HTML.
Keep text in reading order and keep nearby labels with the content they belong to.
Return only Markdown and inline HTML with no explanation.`

export function normalizeOcrSettings(settings = {}) {
  return {
    baseUrl: normalizeSettingValue(settings.baseUrl, DEFAULT_OCR_SETTINGS.baseUrl),
    endpoint: normalizeSettingValue(settings.endpoint, DEFAULT_OCR_SETTINGS.endpoint),
    model: normalizeSettingValue(settings.model, DEFAULT_OCR_SETTINGS.model),
  }
}

export function getInitialOcrSettings() {
  if (typeof window === 'undefined') {
    return normalizeOcrSettings()
  }

  try {
    const rawValue = window.localStorage.getItem(OCR_SETTINGS_STORAGE_KEY)

    if (!rawValue) {
      return normalizeOcrSettings()
    }

    return normalizeOcrSettings(JSON.parse(rawValue))
  } catch {
    return normalizeOcrSettings()
  }
}

export function persistOcrSettings(settings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    OCR_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeOcrSettings(settings)),
  )
}

export function clearPersistedOcrSettings() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(OCR_SETTINGS_STORAGE_KEY)
}

export function resolveOcrRequestUrl(settings) {
  const { baseUrl, endpoint } = normalizeOcrSettings(settings)

  if (isAbsoluteUrl(endpoint)) {
    return endpoint
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  return `${normalizedBaseUrl}${normalizedEndpoint}`
}

export function hasOcrSettingsOverride(settings) {
  const normalizedSettings = normalizeOcrSettings(settings)

  return (
    normalizedSettings.baseUrl !== DEFAULT_OCR_SETTINGS.baseUrl ||
    normalizedSettings.endpoint !== DEFAULT_OCR_SETTINGS.endpoint ||
    normalizedSettings.model !== DEFAULT_OCR_SETTINGS.model
  )
}

function normalizeSettingValue(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmedValue = value.trim()
  return trimmedValue || fallback
}

function normalizeBaseUrl(baseUrl) {
  const trimmedBaseUrl = baseUrl.trim()

  if (!trimmedBaseUrl) {
    return ''
  }

  if (isAbsoluteUrl(trimmedBaseUrl)) {
    return trimmedBaseUrl.replace(/\/+$/, '')
  }

  const prefixedBaseUrl = trimmedBaseUrl.startsWith('/')
    ? trimmedBaseUrl
    : `/${trimmedBaseUrl}`

  return prefixedBaseUrl.replace(/\/+$/, '')
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value)
}
