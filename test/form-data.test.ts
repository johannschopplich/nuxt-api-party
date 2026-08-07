import type { SerializedBlob } from '../src/runtime/form-data'
import { describe, expect, it } from 'vitest'
import { formDataToObject, objectToFormData } from '../src/runtime/form-data'

// Enough bytes that an encoder without chunking overflows the stack instead of
// quietly returning something wrong.
const BLOB_BYTE_LENGTH = 200_000

function createBlobBytes() {
  return Uint8Array.from({ length: BLOB_BYTE_LENGTH }, (_, index) => index % 256)
}

describe('formDataToObject', () => {
  it('encodes a 200,000-byte blob as base64 of its bytes', async () => {
    const bytes = createBlobBytes()
    const formData = new FormData()
    formData.append('upload', new Blob([bytes]), 'payload.bin')

    const { entries } = await formDataToObject(formData)
    const decoded = Uint8Array.from(
      globalThis.atob((entries[0]![1] as SerializedBlob).data),
      character => character.charCodeAt(0),
    )

    expect(decoded).toEqual(bytes)
  })

  it('keeps repeated field names in their original order', async () => {
    const formData = new FormData()
    formData.append('tag', 'first')
    formData.append('title', 'between')
    formData.append('tag', 'second')

    const { entries } = await formDataToObject(formData)

    expect(entries).toEqual([
      ['tag', 'first'],
      ['title', 'between'],
      ['tag', 'second'],
    ])
  })

  it('serializes a field named __type as an ordinary entry', async () => {
    const formData = new FormData()
    formData.append('__type', 'user value')

    const serialized = await formDataToObject(formData)

    expect(serialized.__type).toBe('form-data')
    expect(serialized.entries).toEqual([['__type', 'user value']])
  })
})

describe('objectToFormData', () => {
  it('restores the blob\'s bytes, type and name', async () => {
    const bytes = createBlobBytes()
    const formData = new FormData()
    formData.append('upload', new Blob([bytes], { type: 'application/octet-stream' }), 'payload.bin')

    const restored = await objectToFormData(await formDataToObject(formData))
    const blob = restored.get('upload') as File

    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes)
    expect(blob.type).toBe('application/octet-stream')
    expect(blob.name).toBe('payload.bin')
  })

  it('restores repeated field names in their original order', async () => {
    const formData = new FormData()
    formData.append('tag', 'first')
    formData.append('title', 'between')
    formData.append('tag', 'second')

    const restored = await objectToFormData(await formDataToObject(formData))

    expect([...restored.entries()]).toEqual([...formData.entries()])
  })
})
