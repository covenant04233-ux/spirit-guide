/**
 * OpenAI-compatible Chat Completions streaming (SSE).
 * Works with DeepSeek, SiliconFlow, OpenRouter, Groq, etc.
 */

function parseSseDataLine(line) {
  const prefix = 'data: '
  if (!line.startsWith(prefix)) return null
  const payload = line.slice(prefix.length).trim()
  if (payload === '[DONE]') return { done: true }
  try {
    const json = JSON.parse(payload)
    const delta = json?.choices?.[0]?.delta
    const content = delta?.content
    if (typeof content === 'string' && content.length) return { text: content }
  } catch {
    /* ignore malformed chunk */
  }
  return null
}

export async function streamOpenAICompatibleChat({
  baseUrl,
  apiKey,
  model,
  prompt,
  onChunk,
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.9,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(errText || `HTTP ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const dec = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += dec.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parsed = parseSseDataLine(trimmed)
      if (!parsed) continue
      if (parsed.done) return
      if (parsed.text) onChunk(parsed.text)
    }
  }
}
