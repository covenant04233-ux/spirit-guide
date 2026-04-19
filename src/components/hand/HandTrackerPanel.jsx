import { useTranslation } from 'react-i18next'
import { useGestureSession } from '../../context/GestureSessionContext'
import { useHandTracking } from '../../context/HandTrackingContext'

export function HandTrackerPanel() {
  const { t } = useTranslation()
  const { cardsRevealed } = useGestureSession()
  const { videoRef, status, errorMessage, startTracking, stopTracking } =
    useHandTracking()

  return (
    <div
      className={`pointer-events-auto fixed left-1/2 z-[25] flex w-[min(72vw,220px)] max-w-[220px] -translate-x-1/2 flex-col gap-1.5 rounded-xl border border-white/10 bg-black/50 p-2 shadow-xl backdrop-blur-md ${
        cardsRevealed
          ? 'bottom-[calc(min(42vh,420px)+6px)]'
          : 'bottom-2 pb-[env(safe-area-inset-bottom,0px)] md:bottom-3'
      }`}
    >
      <p className="text-center font-sans text-[10px] leading-snug text-slate-400">
        {t('camera.hint')}
      </p>

      <div className="overflow-hidden rounded-lg border border-violet-500/20 bg-black/60 ring-1 ring-white/5">
        <video
          ref={videoRef}
          className="h-[104px] w-full scale-x-[-1] object-cover sm:h-[112px]"
          playsInline
          muted
          autoPlay
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {status === 'idle' && (
          <button
            type="button"
            onClick={startTracking}
            className="rounded-lg bg-violet-600 px-3 py-2 font-sans text-xs font-medium text-white transition hover:bg-violet-500"
          >
            {t('camera.start')}
          </button>
        )}
        {status === 'loading' && (
          <span className="font-sans text-xs text-violet-200/90">
            {t('camera.loading')}
          </span>
        )}
        {status === 'running' && (
          <button
            type="button"
            onClick={stopTracking}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 font-sans text-xs text-slate-200 transition hover:bg-white/10"
          >
            {t('camera.stop')}
          </button>
        )}
        {status === 'error' && (
          <>
            <button
              type="button"
              onClick={startTracking}
              className="rounded-lg bg-violet-600 px-3 py-2 font-sans text-xs font-medium text-white hover:bg-violet-500"
            >
              {t('camera.retry')}
            </button>
            <p className="w-full text-center font-sans text-[11px] text-red-300/90">
              {errorMessage || t('camera.errorGeneric')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
