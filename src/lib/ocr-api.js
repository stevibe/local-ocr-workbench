import { OCR_PROMPT, normalizeOcrSettings, resolveOcrRequestUrl } from '../config/ocr'
import { readBlobAsBase64 } from './document'

export async function streamOcrMarkdown({ blob, onChunk, settings, signal }) {
  const ocrSettings = normalizeOcrSettings(settings)
  const requestStartedAt = performance.now()
  const encodedImage = await readBlobAsBase64(blob)
  const response = await fetch(resolveOcrRequestUrl(ocrSettings), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      model: ocrSettings.model,
      prompt: OCR_PROMPT,
      images: [encodedImage],
      options: {
        temperature: 0,
      },
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error || 'The OCR request failed.')
  }

  if (!response.body) {
    throw new Error('The browser did not receive a readable response stream.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let streamedMarkdown = ''
  let firstTokenAt = null
  let tokensPerSecond = null

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    pending += decoder.decode(value, { stream: true })
    const lines = pending.split('\n')
    pending = lines.pop() ?? ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine) {
        continue
      }

      const chunk = JSON.parse(trimmedLine)

      if (chunk.error) {
        throw new Error(chunk.error)
      }

      if (typeof chunk.response === 'string' && chunk.response) {
        if (firstTokenAt === null) {
          firstTokenAt = performance.now()
        }

        streamedMarkdown += chunk.response
        onChunk(streamedMarkdown)
      }

      if (chunk.done) {
        if (
          typeof chunk.eval_count === 'number' &&
          typeof chunk.eval_duration === 'number' &&
          chunk.eval_duration > 0
        ) {
          tokensPerSecond = (chunk.eval_count / chunk.eval_duration) * 1_000_000_000
        }

        return buildOcrResult({
          markdown: streamedMarkdown,
          firstTokenAt,
          requestStartedAt,
          tokensPerSecond,
        })
      }
    }
  }

  const trailingLine = pending.trim()

  if (trailingLine) {
    const chunk = JSON.parse(trailingLine)

    if (chunk.error) {
      throw new Error(chunk.error)
    }

    if (typeof chunk.response === 'string' && chunk.response) {
      streamedMarkdown += chunk.response
      onChunk(streamedMarkdown)
    }
  }

  return buildOcrResult({
    markdown: streamedMarkdown,
    firstTokenAt,
    requestStartedAt,
    tokensPerSecond,
  })
}

function buildOcrResult({ markdown, firstTokenAt, requestStartedAt, tokensPerSecond }) {
  const finalMarkdown = markdown.trim()

  if (!finalMarkdown) {
    throw new Error('The model returned an empty response.')
  }

  return {
    markdown: finalMarkdown,
    stats: {
      ttftMs: firstTokenAt === null ? null : Math.max(0, firstTokenAt - requestStartedAt),
      tokensPerSecond,
    },
  }
}
