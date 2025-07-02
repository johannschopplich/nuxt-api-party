export function isFormData(obj: unknown): obj is FormData {
  return obj instanceof FormData
}
