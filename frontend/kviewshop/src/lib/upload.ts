/** Upload an image file via the server-side upload API */
export async function uploadImage(file: File, folder: string = 'uploads'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Upload failed')
  }

  const { url } = await res.json()
  return url
}
