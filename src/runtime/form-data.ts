export interface SerializedBlob {
  data: string
  type: string
  name: string
  __type: 'blob'
}

export type SerializedFormDataEntry = [key: string, value: string | SerializedBlob]

export interface SerializedFormData {
  /**
   * The form's fields in their original order. Repeated field names survive as
   * separate entries, and no field can collide with `__type`.
   */
  entries: SerializedFormDataEntry[]
  __type: 'form-data'
}

export function isFormData(obj: unknown): obj is FormData {
  return obj instanceof FormData
}

export function isSerializedFormData(obj: unknown): obj is SerializedFormData {
  return (
    typeof obj === 'object'
    && obj !== null
    && '__type' in obj
    && obj.__type === 'form-data'
    && 'entries' in obj
    && Array.isArray(obj.entries)
  )
}

export async function formDataToObject(formData: FormData): Promise<SerializedFormData> {
  const entries = await Promise.all(
    [...formData.entries()].map(
      async ([key, value]): Promise<SerializedFormDataEntry> => [
        key,
        value instanceof Blob ? await serializeBlob(value) : value,
      ],
    ),
  )

  return {
    entries,
    __type: 'form-data',
  }
}

export async function objectToFormData(obj: SerializedFormData) {
  const formData = new FormData()

  for (const [key, value] of obj.entries) {
    if (isSerializedBlob(value))
      formData.append(key, deserializeBlob(value), value.name)
    else
      formData.append(key, value)
  }

  return formData
}

function isSerializedBlob(obj: unknown): obj is SerializedBlob {
  return (
    typeof obj === 'object'
    && obj !== null
    && '__type' in obj
    && obj.__type === 'blob'
  )
}

/**
 * Bytes encoded per `btoa` call. Every byte travels as its own argument to
 * `String.fromCharCode`, which overflows the stack past roughly 125,000 of them
 * – fewer the deeper the call stack. Divisible by three, so each chunk encodes
 * without padding and the base64 pieces concatenate.
 */
const BASE64_CHUNK_SIZE = 32_766

async function serializeBlob(file: File): Promise<SerializedBlob> {
  const byteArray = new Uint8Array(await file.arrayBuffer())
  let data = ''

  for (let offset = 0; offset < byteArray.length; offset += BASE64_CHUNK_SIZE) {
    const chunk = byteArray.subarray(offset, offset + BASE64_CHUNK_SIZE)
    data += globalThis.btoa(String.fromCharCode.apply(null, chunk as unknown as number[]))
  }

  return {
    data,
    type: file.type,
    name: file.name,
    __type: 'blob',
  }
}

function deserializeBlob(serializedBlob: SerializedBlob) {
  const binaryString = globalThis.atob(serializedBlob.data)
  const byteArray = new Uint8Array(binaryString.length)

  for (let index = 0; index < binaryString.length; index++)
    byteArray[index] = binaryString.charCodeAt(index)

  return new Blob([byteArray], { type: serializedBlob.type })
}
