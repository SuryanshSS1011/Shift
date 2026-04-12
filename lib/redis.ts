import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached
  const fresh = await fetcher()
  await redis.setex(key, ttlSeconds, fresh)
  return fresh
}
