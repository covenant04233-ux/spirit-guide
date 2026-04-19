import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HandTrackerPanel } from './components/hand/HandTrackerPanel'
import { PhaseHud } from './components/hud/PhaseHud'
import { SagePanel } from './components/sage/SagePanel'
import { TarotScene } from './components/tarot/TarotScene'
import { GestureSessionProvider } from './context/GestureSessionContext'
import { HandTrackingProvider } from './context/HandTrackingContext'
import { setAppLanguage } from './i18n'

const LANGS = [
  { code: 'zh-CN', label: '简体' },
  { code: 'zh-TW', label: '繁體' },
  { code: 'en', label: 'EN' },
]

export default function App() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = t('app.title')
  }, [i18n.language, t])

  return (
    <HandTrackingProvider>
      <GestureSessionProvider>
        <div className="relative h-full w-full">
          <div className="absolute inset-0 z-0">
            <TarotScene />
          </div>

          <HandTrackerPanel />
          <PhaseHud />
          <SagePanel />

          <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-between gap-4 p-6">
            <div className="pointer-events-auto rounded-lg border border-white/10 bg-black/35 px-5 py-4 shadow-lg backdrop-blur-md">
              <h1 className="font-display text-2xl font-semibold tracking-wide text-slate-100 md:text-3xl">
                {t('app.title')}
              </h1>
              <p className="mt-1 font-sans text-sm text-slate-400">
                {t('app.subtitle')}
              </p>
            </div>

            <div className="pointer-events-auto flex flex-col items-end gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
                <span>{t('hud.language')}</span>
                <select
                  className="cursor-pointer rounded bg-void/80 px-2 py-1 text-slate-200 outline-none ring-1 ring-white/15 focus:ring-violet-400/50"
                  value={i18n.language}
                  onChange={(e) => setAppLanguage(e.target.value)}
                >
                  {LANGS.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>

          <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-6 pb-[min(46vh,360px)] md:pb-52">
            <p className="mx-auto max-w-xl text-center font-sans text-xs leading-relaxed text-slate-500">
              {t('scene.hint')}
            </p>
          </footer>
        </div>
      </GestureSessionProvider>
    </HandTrackingProvider>
  )
}
