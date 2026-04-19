import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGestureSession } from '../../context/GestureSessionContext'
import { streamSageReply } from '../../lib/streamSage'
import { generateSeedreamComic } from '../../lib/seedreamComic'

export function SagePanel() {
  const { t, i18n } = useTranslation()
  const {
    cardsRevealed,
    selectedIndices,
    deckOrder,
    slotReversed,
    spread,
    userQuestion,
  } = useGestureSession()

  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [comicUrl, setComicUrl] = useState('')
  const [comicBusy, setComicBusy] = useState(false)
  const [comicError, setComicError] = useState('')
  const [comicDownloadHint, setComicDownloadHint] = useState('')
  const started = useRef(false)

  const autoDownloadComic = async (url) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tarot-comic-${stamp}.png`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('DOWNLOAD_FETCH_FAILED')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
      return true
    } catch {
      try {
        // Fallback: may still download/open depending on browser policy.
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.target = '_blank'
        a.rel = 'noreferrer'
        document.body.appendChild(a)
        a.click()
        a.remove()
        return true
      } catch {
        return false
      }
    }
  }

  useEffect(() => {
    if (!cardsRevealed) {
      started.current = false
      setText('')
      setError('')
      setBusy(false)
      setComicUrl('')
      setComicBusy(false)
      setComicError('')
      setComicDownloadHint('')
      return
    }

    if (started.current) return
    started.current = true
    setBusy(true)
    setError('')
    setText('')

    const hasCompat =
      import.meta.env.VITE_OPENAI_COMPAT_API_KEY?.trim() &&
      import.meta.env.VITE_OPENAI_COMPAT_BASE_URL?.trim()
    const hasGemini = import.meta.env.VITE_GEMINI_API_KEY?.trim()
    if (!hasCompat && !hasGemini) {
      setError(i18n.t('sage.missingKey'))
      setBusy(false)
      return
    }

    let acc = ''
    streamSageReply({
      i18nLang: i18n.language,
      userQuestion,
      spread,
      selectedIndices,
      deckOrder,
      slotReversed,
      onChunk: (chunk) => {
        acc += chunk
        setText(acc)
      },
    })
      .catch((e) => {
        const msg = e.message || String(e)
        if (msg === 'MISSING_LLM_CONFIG') setError(i18n.t('sage.missingKey'))
        else setError(msg)
      })
      .finally(() => {
        setBusy(false)
      })
  }, [cardsRevealed, selectedIndices, deckOrder, slotReversed, spread, userQuestion, i18n.language])

  const handleGenerateComic = async () => {
    if (!text?.trim()) return
    setComicBusy(true)
    setComicError('')
    setComicDownloadHint('')
    try {
      const url = await generateSeedreamComic({
        readingText: text,
        userQuestion,
        i18nLang: i18n.language,
      })
      setComicUrl(url)
      const ok = await autoDownloadComic(url)
      if (ok) setComicDownloadHint('Comic auto-downloaded to your default Downloads folder.')
    } catch (e) {
      const msg = e?.message || String(e)
      if (msg === 'MISSING_DOUBAO_IMAGE_KEY') setComicError(t('sage.comicMissingKey'))
      else if (msg === 'EMPTY_READING_TEXT') setComicError(t('sage.comicEmptyReading'))
      else setComicError(msg)
    } finally {
      setComicBusy(false)
    }
  }

  if (!cardsRevealed) return null

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 max-h-[min(42vh,420px)] border-t border-amber-500/20 bg-black/80 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold tracking-wide text-amber-100/95">
            {t('sage.title')}
          </h2>
          {busy && (
            <span className="font-sans text-[10px] text-amber-200/70">
              {t('sage.streaming')}
            </span>
          )}
        </div>
        {error ? (
          <p className="font-sans text-xs leading-relaxed text-red-300/90">{error}</p>
        ) : (
          <div className="max-h-[min(30vh,300px)] overflow-y-auto pr-1 font-sans text-sm leading-relaxed text-slate-200/95">
            {text || (busy ? t('sage.waiting') : '')}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleGenerateComic}
            disabled={busy || comicBusy || !text.trim()}
            className="rounded-md border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 font-sans text-xs text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {comicBusy ? t('sage.comicGenerating') : t('sage.comicGenerate')}
          </button>
          {comicUrl ? (
            <a
              href={comicUrl}
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[11px] text-amber-200/80 underline decoration-amber-300/40 underline-offset-2"
            >
              {t('sage.comicOpenNew')}
            </a>
          ) : null}
        </div>
        {comicError ? (
          <p className="font-sans text-xs leading-relaxed text-red-300/90">{comicError}</p>
        ) : null}
        {comicDownloadHint ? (
          <p className="font-sans text-xs leading-relaxed text-emerald-300/90">
            {comicDownloadHint}
          </p>
        ) : null}
        {comicUrl ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black/30">
            <img
              src={comicUrl}
              alt={t('sage.comicAlt')}
              className="h-auto w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
