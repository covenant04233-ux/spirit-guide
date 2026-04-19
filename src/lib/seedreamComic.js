/** 开发/预览时走 Vite 同源代理，避免浏览器对火山域名的 CORS 拦截 */
export function resolveDoubaoApiBaseForFetch() {
  const explicit = import.meta.env.VITE_DOUBAO_BASE_URL?.trim()
  if (import.meta.env.PROD) {
    return explicit || 'https://ark.cn-beijing.volces.com/api/v3'
  }
  if (import.meta.env.VITE_DOUBAO_DEV_PROXY === 'false') {
    return explicit || 'https://ark.cn-beijing.volces.com/api/v3'
  }
  return '/__dev-proxy/ark-api'
}

/** 将方舟返回的图片 URL 转为同源代理地址，便于 fetch 成 Blob 并触发本地下载 */
export function resolveComicImageDownloadUrl(remoteImageUrl) {
  if (!remoteImageUrl || remoteImageUrl.startsWith('blob:')) {
    return remoteImageUrl
  }
  if (import.meta.env.PROD || import.meta.env.VITE_DOUBAO_DEV_PROXY === 'false') {
    return remoteImageUrl
  }
  return `/__dev-proxy/ark-image?url=${encodeURIComponent(remoteImageUrl)}`
}

function buildComicPrompt({ readingText, userQuestion, i18nLang }) {
  const langLine =
    i18nLang === 'en'
      ? 'All panel captions must be in English.'
      : i18nLang === 'zh-TW'
        ? '所有分鏡文字請使用繁體中文。'
        : '所有分镜文字请使用简体中文。'

  const q = (userQuestion || '').trim()
  return [
    'Create a single image in strict 2x2 four-panel comic layout.',
    'Tarot mystical narrative style, cinematic lighting, coherent characters and visual identity across all four panels.',
    'Do NOT depict card drawing, shuffling, hand gestures, flipping cards, fortune-telling table, or any UI/app scene.',
    'Story must be based only on the seeker question and the tarot interpretation text below.',
    'Panel 1: establish the real-life context of the seeker question.',
    'Panel 2: show the key conflict/challenge and emotional tension.',
    'Panel 3: show a symbolic turning point inspired by tarot meaning (not literal card-drawing process).',
    'Panel 4: show a grounded outcome and actionable guidance.',
    'Include short caption text inside each panel.',
    langLine,
    q
      ? `Seeker question (must be reflected in story): ${q}`
      : 'Seeker question: general life guidance.',
    `Tarot interpretation to adapt:\n${readingText}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * 调用火山方舟 Seedream 文生图（默认 doubao-seedream-4-0，即 Seedream 4.0）。
 * onProgress：0–100。方舟该接口为单次 HTTP，无服务端分步进度，这里在请求等待期间做平滑占位进度。
 */
export async function generateSeedreamComic({
  readingText,
  userQuestion,
  i18nLang,
  onProgress,
}) {
  const apiKey = import.meta.env.VITE_DOUBAO_API_KEY?.trim()
  const model =
    import.meta.env.VITE_DOUBAO_SEEDREAM_MODEL?.trim() ||
    'doubao-seedream-4-0-250828'
  const base = resolveDoubaoApiBaseForFetch()

  if (!apiKey) {
    throw new Error('MISSING_DOUBAO_IMAGE_KEY')
  }
  if (!readingText?.trim()) {
    throw new Error('EMPTY_READING_TEXT')
  }

  const prompt = buildComicPrompt({ readingText, userQuestion, i18nLang })
  onProgress?.(4)

  let tick = 0
  let intervalId = null
  const clearTick = () => {
    if (intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  intervalId = setInterval(() => {
    tick += 1
    const cap = 90
    const n = Math.min(
      cap,
      Math.round(8 + tick * 2.4 + Math.sin(tick / 4) * 2),
    )
    onProgress?.(n)
  }, 280)

  try {
    const res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        response_format: 'url',
        size: '2K',
        watermark: true,
      }),
    })

    clearTick()
    onProgress?.(94)

    if (!res.ok) {
      const detail = await res.text()
      onProgress?.(0)
      throw new Error(`SEEDREAM_API_ERROR ${res.status}: ${detail}`)
    }

    const data = await res.json()
    const item = data?.data?.[0]
    if (!item) {
      onProgress?.(0)
      throw new Error('SEEDREAM_EMPTY_IMAGE')
    }
    onProgress?.(98)

    if (typeof item.url === 'string' && item.url.length) {
      onProgress?.(100)
      return item.url
    }
    if (typeof item.b64_json === 'string' && item.b64_json.length) {
      const bin = atob(item.b64_json)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blobUrl = URL.createObjectURL(
        new Blob([bytes], { type: 'image/png' }),
      )
      onProgress?.(100)
      return blobUrl
    }
    onProgress?.(0)
    throw new Error('SEEDREAM_EMPTY_IMAGE')
  } catch (e) {
    clearTick()
    onProgress?.(0)
    throw e
  }
}
