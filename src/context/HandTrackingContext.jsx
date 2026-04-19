import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'

const HandTrackingContext = createContext(null)

export function HandTrackingProvider({ children }) {
  const trackingRef = useRef({
    ndcX: 0,
    ndcY: 0,
    visible: false,
    wristNx: 0.5,
    wristNy: 0.5,
    pinch: false,
    /** 食指捏合指向同一张牌时的 0–1 进度（由 GestureBridge 写入） */
    pinchSelectProgress: 0,
    /** 翻牌：手掌收拢（多指弯曲靠近掌心） */
    palmGathered: false,
  })
  const videoRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const stopTracking = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    try {
      landmarkerRef.current?.close?.()
    } catch {
      /* ignore */
    }
    landmarkerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const v = videoRef.current
    if (v) v.srcObject = null
    trackingRef.current.visible = false
    trackingRef.current.pinch = false
    trackingRef.current.pinchSelectProgress = 0
    trackingRef.current.palmGathered = false
    setStatus('idle')
    setErrorMessage('')
  }, [])

  const startTracking = useCallback(async () => {
    setErrorMessage('')
    setStatus('loading')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setErrorMessage('getUserMedia is not supported in this browser.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      streamRef.current = stream
    } catch (e) {
      setStatus('error')
      setErrorMessage(e.message || String(e))
      return
    }

    const video = videoRef.current
    if (!video) {
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setStatus('error')
      setErrorMessage('Video element is not ready.')
      return
    }

    video.srcObject = stream
    try {
      await video.play()
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setStatus('error')
      setErrorMessage(e.message || String(e))
      return
    }

    try {
      const { HandLandmarker, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      )
      const wasm = await FilesetResolver.forVisionTasks(WASM_BASE)

      const base = {
        modelAssetPath: MODEL_URL,
      }

      let landmarker
      try {
        landmarker = await HandLandmarker.createFromOptions(wasm, {
          baseOptions: { ...base, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        })
      } catch {
        landmarker = await HandLandmarker.createFromOptions(wasm, {
          baseOptions: { ...base, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        })
      }
      landmarkerRef.current = landmarker

      const loop = () => {
        const lm = landmarkerRef.current
        const vid = videoRef.current
        if (!lm || !vid || vid.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        const result = lm.detectForVideo(vid, performance.now())
        if (result.landmarks?.length) {
          const L = result.landmarks[0]
          const tip = L[8]
          const wrist = L[0]
          const thumbTip = L[4]
          const mx = 1 - tip.x
          trackingRef.current.ndcX = mx * 2 - 1
          trackingRef.current.ndcY = -(tip.y * 2 - 1)
          trackingRef.current.wristNx = 1 - wrist.x
          trackingRef.current.wristNy = wrist.y
          const pinchDist = Math.hypot(thumbTip.x - tip.x, thumbTip.y - tip.y)
          trackingRef.current.pinch = pinchDist < 0.055

          const d2 = (a, b) =>
            Math.hypot(L[a].x - L[b].x, L[a].y - L[b].y)

          /** 指尖靠近掌指关节 ≈ 屈指 / 握拳（阈值略放宽，避免误判不到） */
          const curledTowardMcp = (tipIdx, mcpIdx, maxD) =>
            d2(tipIdx, mcpIdx) < maxD

          /** 指尖比更靠近指尖的关节还靠近掌指 → 明显折向掌心 */
          const foldedSegment = (tipIdx, pipIdx, mcpIdx) => {
            const dm = d2(tipIdx, mcpIdx)
            const dp = d2(tipIdx, pipIdx)
            return dm < 0.12 && dm <= dp * 1.05
          }

          const fingerOk = (tip, pip, mcp) =>
            foldedSegment(tip, pip, mcp) ||
            curledTowardMcp(tip, mcp, 0.108) ||
            curledTowardMcp(tip, mcp, 0.125)

          const folds = [
            fingerOk(8, 6, 5),
            fingerOk(12, 10, 9),
            fingerOk(16, 14, 13),
            fingerOk(20, 18, 17),
          ]
          const foldCount = folds.filter(Boolean).length

          const tips = [8, 12, 16, 20]
          const xs = tips.map((i) => L[i].x)
          const ys = tips.map((i) => L[i].y)
          const spread = Math.hypot(
            Math.max(...xs) - Math.min(...xs),
            Math.max(...ys) - Math.min(...ys),
          )
          const tightFistCluster = spread < 0.27

          const avgTipWrist =
            tips.reduce((s, i) => s + d2(i, 0), 0) / tips.length
          const handPulledIn = avgTipWrist < 0.22

          trackingRef.current.palmGathered =
            foldCount >= 3 ||
            (foldCount >= 2 && tightFistCluster) ||
            (foldCount >= 2 && handPulledIn) ||
            (foldCount >= 1 && tightFistCluster && spread < 0.22)

          trackingRef.current.visible = true
        } else {
          trackingRef.current.visible = false
          trackingRef.current.pinch = false
          trackingRef.current.palmGathered = false
        }
        rafRef.current = requestAnimationFrame(loop)
      }

      setStatus('running')
      rafRef.current = requestAnimationFrame(loop)
    } catch (e) {
      console.error(e)
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      video.srcObject = null
      setStatus('error')
      setErrorMessage(e.message || String(e))
    }
  }, [])

  const value = useMemo(
    () => ({
      trackingRef,
      videoRef,
      status,
      errorMessage,
      startTracking,
      stopTracking,
    }),
    [status, errorMessage, startTracking, stopTracking],
  )

  return (
    <HandTrackingContext.Provider value={value}>
      {children}
    </HandTrackingContext.Provider>
  )
}

export function useHandTracking() {
  const ctx = useContext(HandTrackingContext)
  if (!ctx) {
    throw new Error('useHandTracking must be used within HandTrackingProvider')
  }
  return ctx
}
