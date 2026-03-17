import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export function readBlobAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result

      if (typeof result !== 'string') {
        reject(new Error('Failed to read the selected page.'))
        return
      }

      const base64 = result.split(',')[1]

      if (!base64) {
        reject(new Error('Failed to encode the selected page.'))
        return
      }

      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read the selected page.'))
    }

    reader.readAsDataURL(blob)
  })
}

export async function loadPdf(file) {
  const buffer = await file.arrayBuffer()
  return pdfjsLib.getDocument({ data: buffer }).promise
}

export async function renderPdfPageToBlob(pdfDocument, pageNumber) {
  const page = await pdfDocument.getPage(pageNumber)
  const baseViewport = page.getViewport({ scale: 1 })
  const longestSide = Math.max(baseViewport.width, baseViewport.height)
  const scale = Math.max(1.35, Math.min(2.1, 1800 / longestSide))
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { alpha: false })

  if (!context) {
    throw new Error('Failed to prepare the PDF page canvas.')
  }

  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)

  await page.render({
    canvasContext: context,
    viewport,
  }).promise

  page.cleanup()

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error('Failed to render the PDF page.'))
        return
      }

      resolve(result)
    }, 'image/png')
  })

  canvas.width = 0
  canvas.height = 0

  return blob
}
