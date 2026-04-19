import { buildSagePrompt } from './sagePrompt'
import { streamGeminiSage } from './streamGeminiSage'
import { streamOpenAICompatibleChat } from './streamOpenAICompatible'

/**
 * Picks backend from env (priority: OpenAI-compatible > Gemini).
 * No Google account needed if you use DeepSeek / SiliconFlow / OpenRouter, etc.
 */
export async function streamSageReply({
  i18nLang,
  userQuestion,
  spread,
  selectedIndices,
  deckOrder,
  slotReversed,
  onChunk,
}) {
  const prompt = buildSagePrompt({
    i18nLang,
    userQuestion,
    spread,
    selectedIndices,
    deckOrder,
    slotReversed,
  })

  const compatKey = import.meta.env.VITE_OPENAI_COMPAT_API_KEY?.trim()
  const compatBase = import.meta.env.VITE_OPENAI_COMPAT_BASE_URL?.trim()
  const compatModel =
    import.meta.env.VITE_OPENAI_COMPAT_MODEL?.trim() || 'deepseek-chat'

  if (compatKey && compatBase) {
    await streamOpenAICompatibleChat({
      baseUrl: compatBase,
      apiKey: compatKey,
      model: compatModel,
      prompt,
      onChunk,
    })
    return
  }

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (geminiKey) {
    await streamGeminiSage({
      apiKey: geminiKey,
      i18nLang,
      userQuestion,
      spread,
      selectedIndices,
      deckOrder,
      slotReversed,
      onChunk,
    })
    return
  }

  throw new Error('MISSING_LLM_CONFIG')
}
