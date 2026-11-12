/**
 * Ends the stream instead of failing it where its source fails after `signal` aborted. The aborted API
 * response would otherwise surface as the error of a request nobody waits for.
 */
export function endOnAbort(stream: ReadableStream<Uint8Array>, signal: AbortSignal) {
  const reader = stream.getReader()

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done)
          controller.close()
        else
          controller.enqueue(value)
      }
      catch (error) {
        if (signal.aborted)
          controller.close()
        else
          controller.error(error)
      }
    },
    cancel: reason => reader.cancel(reason),
  })
}
