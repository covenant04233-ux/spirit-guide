import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildSagePrompt } from './sagePrompt'

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

/**
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.i18nLang
 * @param {string} opts.userQuestion
 * @param {number} opts.spread
 * @param {number[]} opts.selectedIndices
 * @param {(chunk: string) => void} opts.onChunk
 */
export async function streamGeminiSage({
  apiKey,
  i18nLang,
  userQuestion,
  spread,
  selectedIndices,
  deckOrder,
  slotReversed,
  onChunk,
}) {
  if (!apiKey?.trim()) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim())

  const prompt = buildSagePrompt({
    i18nLang,
    userQuestion,
    spread,
    selectedIndices,
    deckOrder,
    slotReversed,
  })

  let lastErr
  for (const name of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: name,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.9,
        },
      })
      const result = await model.generateContentStream(prompt)
      for await (const chunk of result.stream) {
        const tx = chunk.text()
        if (tx) onChunk(tx)
      }
      return
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr ?? new Error('Gemini stream failed')
}
