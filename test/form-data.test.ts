import type { SerializedBlob } from '../src/runtime/form-data'
import { describe, expect, it } from 'vitest'
import { formDataToObject } from '../src/runtime/form-data'

describe('formDataToObject', () => {
  it('encodes a 20,000-byte blob as base64 of its bytes', async () => {
    // Several times `BINARY_STRING_CHUNK_SIZE`, so the encoder has to stitch chunks together.
    const bytes = Uint8Array.from({ length: 20_000 }, (_, index) => index % 256)
    const formData = new FormData()
    formData.append('upload', new Blob([bytes]), 'payload.bin')

    const serialized = await formDataToObject(formData)
    const decoded = Uint8Array.from(
      globalThis.atob((serialized.upload as SerializedBlob).data),
      character => character.charCodeAt(0),
    )

    expect(decoded).toEqual(bytes)
  })
})
