import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let _r2: S3Client | null = null

function getR2Client(): S3Client {
  if (!_r2) {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'R2 storage not configured. Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
      )
    }

    _r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return _r2
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME
  if (!bucket) throw new Error('R2_BUCKET_NAME env var is not set')
  return bucket
}

function getPublicBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  if (!url) throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL env var is not set')
  return url
}

/** Upload a file to R2 and return its public URL */
export async function uploadFile(
  key: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  await getR2Client().send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: file,
    ContentType: contentType,
  }))

  return `${getPublicBaseUrl()}/${key}`
}

/** Delete a file from R2 */
export async function deleteFile(key: string): Promise<void> {
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }))
}

/** Generate a presigned upload URL for client-side direct uploads */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
}

/** Get the public URL for a stored file key */
export function getPublicUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`
}
