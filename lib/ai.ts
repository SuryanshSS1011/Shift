import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
})

const gemini = createOpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  apiKey: process.env.GEMINI_API_KEY,
})

export async function generateWithFallback<T>(
  schema: z.ZodType<T>,
  prompt: { system: string; user: string },
  temperature = 0.6
): Promise<T> {
  const providers = [
    { client: groq, model: 'llama-3.3-70b-versatile', name: 'Groq' },
    { client: gemini, model: 'gemini-2.0-flash-lite', name: 'Gemini' },
  ]
  for (const provider of providers) {
    try {
      const { object } = await generateObject({
        model: provider.client(provider.model),
        schema,
        system: prompt.system,
        prompt: prompt.user,
        temperature,
      })
      return object
    } catch (err) {
      console.error(`[AI] ${provider.name} failed:`, err)
    }
  }
  throw new Error('All AI providers exhausted')
}
