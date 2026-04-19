import { getRiderWaiteCardLabel } from '../data/riderWaiteDeck'

function positionLabel(i18nLang, index, spread) {
  if (spread === 1) {
    if (i18nLang === 'en') return 'the single draw'
    if (i18nLang === 'zh-TW') return '此牌（單張牌陣）'
    return '此牌（单张牌阵）'
  }
  const labels = {
    en: ['past', 'present', 'future'],
    'zh-TW': ['過去', '現在', '未來'],
    'zh-CN': ['过去', '现在', '未来'],
  }
  const lang = i18nLang === 'en' ? 'en' : i18nLang === 'zh-TW' ? 'zh-TW' : 'zh-CN'
  const arr = labels[lang]
  return arr[index] ?? `#${index + 1}`
}

function orientationLabel(i18nLang, reversed) {
  if (i18nLang === 'en') return reversed ? 'reversed' : 'upright'
  return reversed ? '逆位' : '正位'
}

export function buildSagePrompt({
  i18nLang,
  userQuestion,
  spread,
  selectedIndices,
  deckOrder,
  slotReversed,
}) {
  const lines = selectedIndices.map((slot, idx) => {
    const pos = positionLabel(i18nLang, idx, spread)
    const cardId = deckOrder[slot]
    const reversed = slotReversed[slot]
    const name = getRiderWaiteCardLabel(cardId, i18nLang)
    const ori = orientationLabel(i18nLang, reversed)
    return `- Position (${pos}): Rider–Waite–Smith — ${name} (${ori}); deck card #${String(cardId + 1).padStart(2, '0')}/78.`
  })

  const langLine =
    i18nLang === 'en'
      ? 'Write the entire reply in fluent English.'
      : i18nLang === 'zh-TW'
        ? '請用繁體中文書寫全文，語氣深邃優雅，像無名智者。'
        : '请用简体中文书写全文，语气深邃优雅，像无名智者。'

  const q = (userQuestion || '').trim() || '(seeker left the question open — offer general guidance)'

  return `You are a nameless sage interpreting a gesture-based tarot spread in a ritual web experience.
Seeker's question (may be brief): ${q}
Spread: ${spread} card(s), in selection order (first chosen = first position below).

${lines.join('\n')}

Respond as flowing prose suitable for on-screen streaming (short paragraphs ok). Tie imagery to the question and to each position's meaning (time / theme). Interpret upright vs reversed meanings when reversed is indicated. Do not mention APIs, models, or technology.
${langLine}`
}
