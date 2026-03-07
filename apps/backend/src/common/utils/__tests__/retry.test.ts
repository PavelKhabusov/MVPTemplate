import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry } from '../retry'

// Speed up tests by removing real delays
beforeEach(() => {
  vi.useFakeTimers()
})

import { afterEach } from 'vitest'
afterEach(() => {
  vi.useRealTimers()
})

/** Helper: advance all pending timers so retry delays resolve instantly */
async function flushRetries<T>(promise: Promise<T>): Promise<T> {
  // Run microtasks + timers in a loop until the promise settles
  let settled = false
  let result: T
  let error: unknown

  const p = promise
    .then((v) => {
      settled = true
      result = v
    })
    .catch((e) => {
      settled = true
      error = e
    })

  while (!settled) {
    await vi.advanceTimersByTimeAsync(10_000)
  }

  await p
  if (error) throw error
  return result!
}

describe('withRetry', () => {
  it('should return result on first successful call', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await flushRetries(withRetry(fn))
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry and return result when fn eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('recovered')

    const result = await flushRetries(withRetry(fn, 3, 10))
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should throw last error when all attempts fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent-failure'))

    await expect(flushRetries(withRetry(fn, 3, 10))).rejects.toThrow(
      'persistent-failure',
    )
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should respect custom maxAttempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'))

    await expect(flushRetries(withRetry(fn, 5, 10))).rejects.toThrow('nope')
    expect(fn).toHaveBeenCalledTimes(5)
  })

  it('should default to 3 attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('err'))

    await expect(flushRetries(withRetry(fn))).rejects.toThrow('err')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should succeed on second attempt when first fails', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue(42)

    const result = await flushRetries(withRetry(fn, 2, 10))
    expect(result).toBe(42)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry when maxAttempts is 1', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('single'))

    await expect(flushRetries(withRetry(fn, 1, 10))).rejects.toThrow('single')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
