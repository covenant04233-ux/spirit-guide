import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHandTracking } from '../../context/HandTrackingContext'
import { useGestureSession } from '../../context/GestureSessionContext'

const PHASE_KEY = {
  PRE_START: 'hud.phase_pre',
  WASHING: 'hud.phase_wash',
  SELECTING: 'hud.phase_select',
  REVEALING: 'hud.phase_reveal',
}

export function PhaseHud() {
  const { t } = useTranslation()
  const { status, trackingRef } = useHandTracking()
  const {
    phase,
    spread,
    selectedIndices,
    cardsRevealed,
    revealAnimating,
    revealProgressRef,
    userQuestion,
    setUserQuestion,
    beginRitual,
    setSpread,
    resetRitual,
  } = useGestureSession()

  const [holdVisual, setHoldVisual] = useState(0)
  const [pinchVisual, setPinchVisual] = useState(0)

  useEffect(() => {
    if (phase !== 'REVEALING' || cardsRevealed || revealAnimating) {
      setHoldVisual(0)
      return undefined
    }
    const id = setInterval(() => {
      setHoldVisual(revealProgressRef.current)
    }, 50)
    return () => clearInterval(id)
  }, [phase, cardsRevealed, revealAnimating, revealProgressRef])

  useEffect(() => {
    if (phase !== 'SELECTING') {
      setPinchVisual(0)
      return undefined
    }
    const id = setInterval(() => {
      setPinchVisual(trackingRef.current.pinchSelectProgress ?? 0)
    }, 50)
    return () => clearInterval(id)
  }, [phase, trackingRef])

  const phaseLabel = t(PHASE_KEY[phase] ?? 'hud.phase_pre')
  const camOff = status !== 'running'
  const spreadLocked =
    phase === 'WASHING' ||
    phase === 'SELECTING' ||
    (phase === 'REVEALING' && !cardsRevealed)

  return (
    <div className="pointer-events-auto absolute right-6 top-24 z-20 w-[min(92vw,280px)] rounded-xl border border-white/10 bg-black/45 p-4 shadow-xl backdrop-blur-md md:top-28">
      <div className="font-sans text-[10px] uppercase tracking-wider text-slate-500">
        {t('hud.phase')}
      </div>
      <div className="mt-1 font-display text-lg text-amber-100/95">{phaseLabel}</div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="font-sans text-[11px] text-slate-400">{t('hud.spread')}</div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setSpread(1)}
            disabled={spreadLocked}
            className={`flex-1 rounded-lg border px-2 py-2 font-sans text-xs transition ${
              spread === 1
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {t('hud.oneCard')}
          </button>
          <button
            type="button"
            onClick={() => setSpread(3)}
            disabled={spreadLocked}
            className={`flex-1 rounded-lg border px-2 py-2 font-sans text-xs transition ${
              spread === 3
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {t('hud.threeCard')}
          </button>
        </div>
      </div>

      {phase === 'PRE_START' && (
        <>
          <label className="mt-4 block font-sans text-[11px] text-slate-400">
            {t('hud.yourQuestion')}
            <textarea
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-black/40 px-2 py-2 font-sans text-xs text-slate-200 outline-none ring-1 ring-white/5 placeholder:text-slate-600 focus:border-amber-500/30 focus:ring-amber-400/20"
              placeholder={t('hud.questionPlaceholder')}
            />
          </label>
          <button
            type="button"
            onClick={beginRitual}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-amber-700/90 to-amber-600/90 py-2.5 font-sans text-sm font-medium text-stone-950 shadow-md transition hover:from-amber-600 hover:to-amber-500"
          >
            {t('ritual.begin')}
          </button>
        </>
      )}

      {phase === 'WASHING' && (
        <p className="mt-3 font-sans text-[11px] leading-relaxed text-slate-400">
          {t('ritual.washHint')}
        </p>
      )}

      {phase === 'SELECTING' && (
        <>
          <p className="mt-3 font-sans text-[11px] leading-relaxed text-slate-400">
            {t('ritual.selectHint', { n: selectedIndices.length, total: spread })}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-300/70 to-amber-300/90 transition-[width] duration-75"
              style={{ width: `${Math.round(pinchVisual * 100)}%` }}
            />
          </div>
          <p className="mt-1 font-sans text-[10px] text-slate-500">
            {t('ritual.pinchProgressHint')}
          </p>
        </>
      )}

      {phase === 'REVEALING' && !cardsRevealed && (
        <>
          <p className="mt-3 font-sans text-[11px] leading-relaxed text-amber-200/80">
            {revealAnimating ? t('ritual.revealAnimating') : t('ritual.revealHoldHint')}
          </p>
          {!revealAnimating && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-200/80 to-amber-400/90 transition-[width] duration-75"
                style={{ width: `${Math.round(holdVisual * 100)}%` }}
              />
            </div>
          )}
        </>
      )}

      {phase === 'REVEALING' && cardsRevealed && (
        <p className="mt-3 font-sans text-[11px] leading-relaxed text-amber-100/85">
          {t('ritual.revealedDone')}
        </p>
      )}

      {camOff && (
        <p className="mt-2 font-sans text-[10px] text-slate-500">
          {t('ritual.cameraSuggest')}
        </p>
      )}

      {(phase === 'SELECTING' || phase === 'REVEALING' || phase === 'WASHING') && (
        <button
          type="button"
          onClick={resetRitual}
          className="mt-3 w-full rounded-lg border border-white/15 py-2 font-sans text-[11px] text-slate-400 transition hover:border-white/25 hover:text-slate-200"
        >
          {t('ritual.reset')}
        </button>
      )}
    </div>
  )
}
