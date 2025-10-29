const fetchApi = globalThis.fetch

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 180000)
const MAX_SELECTED = Number(process.env.AI_MAX_SELECTED_CHARS || 5000)
const MAX_ALL = Number(process.env.AI_MAX_ALL_CHARS || 1500)

function withTimeout(ms) {
  const ac = new AbortController()
  const t = setTimeout(() => { try { ac.abort() } catch {} }, ms)
  return { signal: ac.signal, cancel: () => clearTimeout(t) }
}

function trimText(text = '', limit = 8000) {
  if (!text) return ''
  if (text.length <= limit) return text
  const head = Math.floor(limit * 0.7)
  const tail = limit - head
  return text.slice(0, head) + '\n...\n' + text.slice(-tail)
}

export async function chat(req, res) {
  try {
    const { messages = [], context = {}, language = 'es', responseFormat } = req.body || {}

    const host = process.env.OLLAMA_HOST
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct'
    if (!host) {
      return res.status(500).json({
        error: 'Falta OLLAMA_HOST en .env',
        detail: 'Configura OLLAMA_HOST=http://localhost:11434 y OLLAMA_MODEL=qwen2.5:3b-instruct'
      })
    }

    const safeContext = {
      ...context,
      selectedChapterText: trimText(context?.selectedChapterText || '', MAX_SELECTED),
      allChaptersText: trimText(context?.allChaptersText || '', MAX_ALL)
    }

    const sysPrompt = buildSystemPrompt(safeContext, language, responseFormat)

    const chatMessages = [
      { role: 'system', content: sysPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    console.log('[AI] Recibido /ai/chat', {
      lenMessages: chatMessages.length,
      selectedLen: (safeContext.selectedChapterText || '').length,
      allLen: (safeContext.allChaptersText || '').length,
      responseFormat: responseFormat || 'markdown',
      timeoutMs: AI_TIMEOUT_MS
    })

    const reply = await callOllama({ host, model }, chatMessages, { responseFormat })
    return res.json({ reply })
  } catch (e) {
    if (e && (e.name === 'AbortError' || String(e).includes('aborted'))) {
      console.warn('[AI] Timeout alcanzado')
      return res.status(504).json({ error: 'timeout', detail: 'La generación tardó demasiado. Intenta con menos preguntas o menos contexto.' })
    }
    console.error('AI /chat error:', e)
    return res.status(500).json({ error: 'AI error', detail: e?.message || String(e) })
  }
}

export async function health(_req, res) {
  try {
    const host = process.env.OLLAMA_HOST
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct'
    if (!host) return res.status(200).json({ ok: false, provider: 'ollama', reason: 'Sin OLLAMA_HOST' })
    const r = await fetchApi(`${host.replace(/\/$/, '')}/api/tags`)
    if (!r.ok) return res.status(200).json({ ok: false, provider: 'ollama', reason: 'Ollama no responde' })
    const data = await r.json()
    const hasModel = Array.isArray(data?.models) && data.models.some((m) => m?.name === model)
    return res.status(200).json({ ok: true, provider: 'ollama', host, model, installed: hasModel })
  } catch (e) {
    return res.status(200).json({ ok: false, provider: 'ollama', reason: e?.message || String(e) })
  }
}

export async function warmupModel() {
  try {
    const host = process.env.OLLAMA_HOST
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct'
    if (!host) return
    console.log(`[AI] Warmup iniciando para ${model}…`)
    const { signal, cancel } = withTimeout(15000)
    const r = await fetchApi(`${host.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
        options: { temperature: 0.2, num_ctx: 1024 }
      })
    })
    cancel()
    if (!r.ok) {
      console.warn('[AI] Warmup fallo', r.status)
      return
    }
    console.log('[AI] Warmup OK')
  } catch (e) {
    console.warn('[AI] Warmup error:', e?.message || String(e))
  }
}

function buildSystemPrompt(context, language, responseFormat) {
  const meta = context?.blogMeta || {}
  const selected = (context?.selectedChapterText || '').trim()
  const all = (context?.allChaptersText || '').trim()
  const langLine = language === 'es' ? 'Responde SIEMPRE en español neutro.' : 'Always answer in English.'

  const base = [
    'Eres un asistente pedagógico experto integrado en un blog técnico/educativo.',
    langLine,
    'Tu objetivo es:',
    '- Responder preguntas basándote SOLO en el contenido proporcionado.',
    '- Generar recursos: exámenes, encuestas, tarjetas de memorización y resúmenes con estructura clara.',
    '- Señalar si falta contexto y pedir precisión si es necesario.',
    '',
    'POLÍTICA DE FUENTES:',
    '- No inventes datos fuera del contexto. Si no está en el contenido, dilo.',
    '',
    `METADATOS DEL BLOG: título="${meta.titulo || 'Blog'}", tipo="${meta.tipo || 'simple'}".`,
    '',
    '=== CONTEXTO (PRIORIDAD AL CAPÍTULO SELECCIONADO) ===',
    selected ? `<<CAPÍTULO SELECCIONADO>>\n${selected}\n<<FIN CAPÍTULO>>` : 'No hay capítulo seleccionado.',
    '',
    all ? `<<TODO EL BLOG>>\n${all}\n<<FIN BLOG>>` : 'No hay texto adicional.',
    ''
  ]

  const schemaQuiz = `
Responde ÚNICAMENTE con un JSON válido (sin texto extra, sin backticks) con este esquema:
{
  "type": "quiz",
  "title": "string",
  "instructions": "string",
  "items": [
    {
      "id": "q1",
      "kind": "single" | "multi" | "boolean",
      "question": "string",
      "choices": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."}],
      "answer": ["A"]
    }
  ]
}
Genera 6–8 preguntas. Evita explicaciones para ahorrar tokens. Mezcla selección múltiple y V/F.
`.trim()

  const schemaSurvey = `
Responde ÚNICAMENTE con un objeto JSON válido:
{
  "type": "survey",
  "title": "string",
  "instructions": "string",
  "items": [
    { "id":"s1","kind":"likert","question":"...","scale":{"min":1,"max":5,"labels":{"1":"Muy en desacuerdo","5":"Muy de acuerdo"}}},
    { "id":"s2","kind":"single","question":"...","options":[{"id":"A","text":"..."},{"id":"B","text":"..."}],"allowOther":true },
    { "id":"s3","kind":"open","question":"..." }
  ]
}
`.trim()

  const schemaFlash = `
Responde ÚNICAMENTE con un objeto JSON válido:
{
  "type": "flashcards",
  "title": "string",
  "cards": [ { "q":"...", "a":"..." } ]
}
Crea ~12 tarjetas.
`.trim()

  const markdownGuide = `
Formato sugerido (Markdown):
- Examen: "Preguntas" + "Respuestas" (mezclar A–D y V/F).
- Encuesta: Likert 1–5, opción múltiple y una abierta.
- Tarjetas: "Pregunta | Respuesta".
- Resumen: viñetas y subtítulos.
`.trim()

  let mode = markdownGuide
  if (responseFormat === 'quiz-json') mode = schemaQuiz
  else if (responseFormat === 'survey-json') mode = schemaSurvey
  else if (responseFormat === 'flashcards-json') mode = schemaFlash

  return [...base, mode].join('\n')
}

async function callOllama(provider, messages, { responseFormat } = {}) {
  const { signal, cancel } = withTimeout(AI_TIMEOUT_MS)
  try {
    const isJson = responseFormat && /json$/.test(responseFormat)
    const numPredict =
      responseFormat === 'quiz-json' ? 900 :
      responseFormat === 'survey-json' ? 700 :
      responseFormat === 'flashcards-json' ? 650 : 800

    const r = await fetchApi(`${provider.host.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: false,
        ...(isJson ? { format: 'json' } : {}),
        options: {
          temperature: 0.2,
          top_p: 0.9,
          num_ctx: 4096,
          num_predict: numPredict
        },
        keep_alive: '2m'
      })
    })
    if (!r.ok) {
      const text = await r.text().catch(() => '')
      throw new Error(`Ollama request failed (${r.status}): ${text}`)
    }
    const data = await r.json()
    const content = data?.message?.content || data?.messages?.map(m => m?.content).join('\n') || ''
    return content || 'Sin respuesta.'
  } finally {
    cancel()
  }
}