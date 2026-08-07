import type { SerializedBlob } from '../src/runtime/form-data'
import { describe, expect, it } from 'vitest'
import { formDataToObject, objectToFormData } from '../src/runtime/form-data'

// Enough bytes that an encoder without chunking overflows the stack instead of
// quietly returning something wrong.
const BLOB_BYTE_LENGTH = 200_000

describe('formDataToObject', () => {
  it('encodes a 200,000-byte blob as base64 of its bytes', async () => {
    const bytes = Uint8Array.from({ length: BLOB_BYTE_LENGTH }, (_, index) => index % 256)
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

describe('objectToFormData', () => {
  it('restores the blob\'s bytes, type and name', async () => {
    const bytes = Uint8Array.from({ length: BLOB_BYTE_LENGTH }, (_, index) => index % 256)
    const formData = new FormData()
    formData.append('upload', new Blob([bytes], { type: 'application/octet-stream' }), 'payload.bin')

    const restored = await objectToFormData(await formDataToObject(formData))
    const blob = restored.get('upload') as File

    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes)
    expect(blob.type).toBe('application/octet-stream')
    expect(blob.name).toBe('payload.bin')
  })
})
