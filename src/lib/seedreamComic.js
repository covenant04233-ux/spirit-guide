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

export async function generateSeedreamComic({
  readingText,
  userQuestion,
  i18nLang,
}) {
  const apiKey = import.meta.env.VITE_DOUBAO_API_KEY?.trim()
  const model =
    import.meta.env.VITE_DOUBAO_SEEDREAM_MODEL?.trim() ||
    'doubao-seedream-4-0-250828'
  const base =
    import.meta.env.VITE_DOUBAO_BASE_URL?.trim() ||
    'https://ark.cn-beijing.volces.com/api/v3'

  if (!apiKey) {
    throw new Error('MISSING_DOUBAO_IMAGE_KEY')
  }
  if (!readingText?.trim()) {
    throw new Error('EMPTY_READING_TEXT')
  }

  const prompt = buildComicPrompt({ readingText, userQuestion, i18nLang })
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

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`SEEDREAM_API_ERROR ${res.status}: ${detail}`)
  }

  const data = await res.json()
  const imageUrl = data?.data?.[0]?.url
  if (!imageUrl) {
    throw new Error('SEEDREAM_EMPTY_IMAGE')
  }
  return imageUrl
}
