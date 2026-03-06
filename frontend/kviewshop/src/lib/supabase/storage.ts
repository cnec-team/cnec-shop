import { getClient } from './client';

const BUCKET_NAME = 'products';

export async function uploadProductImage(
  file: File,
  brandId: string,
  type: 'thumbnail' | 'detail'
): Promise<string | null> {
  const supabase = getClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${brandId}/${type}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function uploadMultipleImages(
  files: File[],
  brandId: string,
  type: 'thumbnail' | 'detail'
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const url = await uploadProductImage(file, brandId, type);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

export async function uploadCreatorProfileImage(
  file: File,
  creatorId: string,
): Promise<string | null> {
  const supabase = getClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `creators/${creatorId}/profile_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, { cacheControl: '3600', upsert: true });

  if (error) {
    console.error('Creator profile upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteProductImage(path: string): Promise<boolean> {
  const supabase = getClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}
