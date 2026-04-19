import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGestureSession } from '../../context/GestureSessionContext'
import { streamSageReply } from '../../lib/streamSage'
import {
  generateSeedreamComic,
  resolveComicImageDownloadUrl,
} from '../../lib/seedreamComic'

function revokeBlobIfNeeded(url) {
  if (url?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }
}

function comicPhaseLabel(t, progress) {
  if (progress >= 100) return t('sage.comicPhaseDone')
  if (progress >= 94) return t('sage.comicPhaseParse')
  if (progress >= 15) return t('sage.comicPhaseRender')
  return t('sage.comicPhaseSubmit')
}

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
  const [comicProgress, setComicProgress] = useState(0)
  const [comicError, setComicError] = useState('')
  const [comicDownloadHint, setComicDownloadHint] = useState('')
  const started = useRef(false)

  const autoDownloadComic = async (url) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `tarot-comic-${stamp}.png`
    try {
      const fetchUrl = resolveComicImageDownloadUrl(url)
      const res = await fetch(fetchUrl)
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
      setComicUrl((prev) => {
        revokeBlobIfNeeded(prev)
        return ''
      })
      setComicBusy(false)
      setComicProgress(0)
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
    setComicUrl((prev) => {
      revokeBlobIfNeeded(prev)
      return ''
    })
    setComicProgress(0)
    setComicBusy(true)
    setComicError('')
    setComicDownloadHint('')
    // 让「生成中」先渲染一帧，避免同步报错时界面完全无反馈
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    )

    let succeeded = false
    try {
      const url = await generateSeedreamComic({
        readingText: text,
        userQuestion,
        i18nLang: i18n.language,
        onProgress: (p) => setComicProgress(p),
      })
      setComicUrl(url)
      setComicProgress(100)
      succeeded = true

      const ok = await autoDownloadComic(url)
      if (ok) setComicDownloadHint(t('sage.comicDownloaded'))
      else setComicDownloadHint(t('sage.comicDownloadManual'))
    } catch (e) {
      const msg = e?.message || String(e)
      if (msg === 'MISSING_DOUBAO_IMAGE_KEY') setComicError(t('sage.comicMissingKey'))
      else if (msg === 'EMPTY_READING_TEXT') setComicError(t('sage.comicEmptyReading'))
      else setComicError(msg)
      setComicProgress(0)
    } finally {
      if (succeeded) {
        await new Promise((r) => setTimeout(r, 420))
      }
      setComicBusy(false)
      if (succeeded) setComicProgress(0)
    }
  }

  if (!cardsRevealed) return null

  const showComicBlock = Boolean(comicUrl || comicBusy)
  const panelBox =
    showComicBlock
      ? 'h-[min(58vh,620px)] max-h-[min(58vh,620px)]'
      : 'h-[min(42vh,420px)] max-h-[min(42vh,420px)]'

  const hasDoubaoKey = Boolean(import.meta.env.VITE_DOUBAO_API_KEY?.trim())

  return (
    <div
      className={`pointer-events-auto fixed inset-x-0 bottom-0 z-[100] flex flex-col overflow-hidden border-t border-amber-500/20 bg-black/90 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-lg ${panelBox}`}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-3">
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
          <div className="min-h-0 max-h-[min(28vh,260px)] shrink-0 overflow-y-auto pr-1 font-sans text-sm leading-relaxed text-slate-200/95">
            {text || (busy ? t('sage.waiting') : '')}
          </div>
        )}

        <div className="mt-1 shrink-0 border-t border-white/5 pt-2">
          <p className="mb-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-amber-200/60">
            {t('sage.comicSectionTitle')}
          </p>
          {!hasDoubaoKey ? (
            <p className="mb-2 font-sans text-[11px] leading-relaxed text-amber-200/80">
              {t('sage.comicNeedDoubaoEnv')}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void handleGenerateComic()
              }}
              disabled={comicBusy || !text.trim() || !hasDoubaoKey}
              className="relative z-[1] rounded-md border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 font-sans text-xs text-amber-100 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
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

          {(comicBusy || comicProgress > 0) && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between gap-2 font-sans text-[10px] text-amber-100/85">
                <span className="min-w-0 flex-1 truncate">
                  {comicPhaseLabel(t, comicBusy ? Math.max(comicProgress, 4) : comicProgress)}
                </span>
                <span className="shrink-0 tabular-nums text-amber-200/90">
                  {Math.round(comicProgress)}%
                </span>
              </div>
              <div
                className="relative h-2 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-inset ring-white/5"
                role="progressbar"
                aria-valuenow={Math.round(comicProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('sage.comicGenerating')}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-violet-500 transition-[width] duration-200 ease-out"
                  style={{ width: `${Math.max(0, Math.min(100, comicProgress))}%` }}
                />
              </div>
            </div>
          )}
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
          <div className="mt-1 overflow-hidden rounded-lg border border-amber-500/20 bg-black/40 shadow-inner">
            <img
              src={resolveComicImageDownloadUrl(comicUrl)}
              alt={t('sage.comicAlt')}
              className="h-auto max-h-[min(38vh,360px)] w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
