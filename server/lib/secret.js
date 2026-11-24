import { timingSafeEqual } from 'node:crypto'

/** Constant-time string compare. An empty expected value never matches. */
export const sameSecret = (given, expected) => {
  const x = Buffer.from(String(given ?? '')), y = Buffer.from(String(expected ?? ''))
  return y.length > 0 && x.length === y.length && timingSafeEqual(x, y)
}
