export interface SerializedBlob {
  data: string
  type: string
  size: number
}

export type SerializedFormData = Record<
  string,
  string | (SerializedBlob & { __type: 'blob' })
>

export function isFormData(obj: unknown): obj is FormData {
  return typeof FormData !== 'undefined' && obj instanceof FormData
}

export function isSerializedFormData(obj: unknown): obj is SerializedFormData {
  return typeof obj === 'object' && obj !== null && '__type' in obj && obj.__type === 'form-data'
}

export async function formDataToObject(formData: FormData) {
  const obj: SerializedFormData = {
    __type: 'form-data',
  }

  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      obj[key] = {
        __type: 'blob',
        ...(await serializeBlob(value)),
      }
    }
    else {
      obj[key] = value
    }
  }

  return obj
}

export async function objectToFormData(obj: SerializedFormData) {
  let formData: FormData

  if (typeof FormData === 'undefined') {
    const { FormData: FormDataPonyfill } = await import('formdata-node')
    // @ts-expect-error: Types misalign with native `FormData`
    formData = new FormDataPonyfill()
  }
  else {
    formData = new FormData()
  }

  const entries = Object.entries(obj).filter(([key]) => key !== '__type')

  for (const [key, value] of entries) {
    if (isSerializedBlob(value)) {
      const arrayBuffer = Uint8Array.from(atob(value.data), c => c.charCodeAt(0))
      const blob = new Blob([arrayBuffer], { type: value.type })
      formData.append(key, blob)
    }
    else {
      formData.append(key, value)
    }
  }

  return formData
}

function isSerializedBlob(obj: unknown): obj is SerializedBlob {
  return typeof obj === 'object' && obj !== null && '__type' in obj && obj.__type === 'blob'
}

function serializeBlob(file: Blob) {
  return new Promise<SerializedBlob>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      const bytes = new Uint8Array(arrayBuffer)
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      const base64 = btoa(binary)
      resolve({
        data: base64,
        type: file.type,
        size: file.size,
      })
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsArrayBuffer(file)
  })
}
