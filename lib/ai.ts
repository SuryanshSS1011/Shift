import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export async function generateWithFallback<T>(
  schema: z.ZodType<T>,
  prompt: { system: string; user: string },
  temperature = 0.6
): Promise<T> {
  const providers = [
    { client: groq, model: 'llama-3.3-70b-versatile', name: 'Groq' },
    { client: google, model: 'gemini-2.5-flash', name: 'Gemini' },
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
