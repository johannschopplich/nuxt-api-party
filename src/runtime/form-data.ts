export interface SerializedBlob {
  data: string
  type: string
  size: number
  name?: string
  __type: 'blob'
}

export type SerializedFormDataValue = string | SerializedBlob | (string | SerializedBlob)[]

export interface SerializedFormData {
  [key: string]: SerializedFormDataValue
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
  )
}

export async function formDataToObject(formData: FormData) {
  const obj: SerializedFormData = {
    __type: 'form-data',
  }

  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      const serializedBlob: SerializedBlob = {
        ...(await serializeBlob(value)),
        name: value.name,
        __type: 'blob',
      }

      if (Array.isArray(obj[key]))
        (obj[key] as SerializedBlob[]).push(serializedBlob)
      else if (obj[key])
        obj[key] = [obj[key] as SerializedBlob, serializedBlob]
      else
        obj[key] = serializedBlob
    }
    else {
      if (Array.isArray(obj[key]))
        (obj[key] as string[]).push(value)
      else if (obj[key])
        obj[key] = [obj[key] as string, value]
      else
        obj[key] = value
    }
  }

  return obj
}

export async function objectToFormData(obj: SerializedFormData) {
  const formData = new FormData()
  const entries = Object.entries(obj).filter(([key]) => key !== '__type')

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isSerializedBlob(item)) {
          const blob = await deserializeBlob(item)
          formData.append(key, blob, item.name)
        }
        else {
          formData.append(key, item)
        }
      }
    }
    else if (isSerializedBlob(value)) {
      const blob = await deserializeBlob(value)
      formData.append(key, blob, value.name)
    }
    else {
      formData.append(key, value)
    }
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

async function serializeBlob(blob: Blob) {
  const byteArray = new Uint8Array(await blob.arrayBuffer())
  let data = ''

  for (let offset = 0; offset < byteArray.length; offset += BASE64_CHUNK_SIZE) {
    const chunk = byteArray.subarray(offset, offset + BASE64_CHUNK_SIZE)
    data += globalThis.btoa(String.fromCharCode.apply(null, chunk as unknown as number[]))
  }

  return {
    data,
    type: blob.type,
    size: blob.size,
  }
}

async function deserializeBlob(serializedBlob: SerializedBlob) {
  const binaryString = globalThis.atob(serializedBlob.data)
  const byteArray = new Uint8Array(binaryString.length)

  for (let index = 0; index < binaryString.length; index++)
    byteArray[index] = binaryString.charCodeAt(index)

  return new Blob([byteArray], { type: serializedBlob.type })
}
