# Local OCR Workbench

A small web app for testing OCR on images and PDFs.

The default setup uses Ollama with `glm-ocr`.

## What It Does

- Upload an image or PDF
- For PDFs, render the current page as an image before OCR
- Send the image to an OCR model
- Stream the result back into the page
- Render the output as markdown

## Run It Locally

1. Install Ollama.

2. Pull the OCR model:

```bash
ollama pull glm-ocr
```

3. Start Ollama.

On macOS and Windows, opening the Ollama app is usually enough.

On Linux, or if you are running it manually:

```bash
ollama serve
```

4. Install dependencies:

```bash
npm install
```

5. Copy the env file:

```bash
cp .env.example .env
```

6. Start the app:

```bash
npm run dev
```

7. Open the local URL from Vite and upload a file.

## Config

You can set the default OCR connection in `.env`.

```env
VITE_OCR_BASE_URL=/api/proxy
VITE_OCR_ENDPOINT=/api/generate
VITE_OCR_MODEL=glm-ocr
OCR_PROXY_TARGET=http://127.0.0.1:11434
```

What these mean:

- `VITE_OCR_BASE_URL`: internal proxy base URL used by the browser
- `VITE_OCR_ENDPOINT`: OCR endpoint path, or a full URL
- `VITE_OCR_MODEL`: model name to send in the request
- `OCR_PROXY_TARGET`: local dev proxy target for Vite

By default, the app calls `/api/proxy/api/generate`, and Vite proxies that to `http://127.0.0.1:11434/api/generate`.

## Backend

This project is built around Ollama.

By default it uses Ollama's native `/api/generate` API and the `glm-ocr` model.

If you want to use a different setup, you can change the endpoint and model in `.env` or in the settings modal, but the easiest supported path is Ollama.

## Settings In The UI

There is a settings button in the top-right corner.

It reads the default values from `.env`, then lets each user override them in the browser:

- OCR endpoint
- Model

These overrides are saved in `localStorage`, so they only affect that browser.

The UI does not write back into `.env`. That is expected. `.env` is a file used by the local dev/build environment, not something a browser app should edit directly.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run check`

## License

MIT. See [LICENSE](LICENSE).
