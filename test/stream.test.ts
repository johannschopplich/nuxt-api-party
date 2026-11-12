import { describe, expect, it } from 'vitest'
import { endOnAbort } from '../src/runtime/server/stream'

describe('endOnAbort', () => {
  it('ends the stream where the source fails after the abort', async () => {
    const abortController = new AbortController()
    const reader = endOnAbort(streamFailingAfterOneChunk(), abortController.signal).getReader()
    await reader.read()

    abortController.abort()

    expect(await reader.read()).toEqual({ done: true, value: undefined })
  })

  it('fails the stream where the source fails without an abort', async () => {
    const reader = endOnAbort(streamFailingAfterOneChunk(), new AbortController().signal).getReader()
    await reader.read()

    await expect(reader.read()).rejects.toThrow('Source failed')
  })
})

function streamFailingAfterOneChunk() {
  let hasSentChunk = false

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (hasSentChunk)
        controller.error(new Error('Source failed'))
      else
        controller.enqueue(new Uint8Array(1))
      hasSentChunk = true
    },
  }, { highWaterMark: 0 })
}
