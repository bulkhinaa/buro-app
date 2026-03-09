/**
 * Storage abstraction — TASK-05
 *
 * Centralized file upload/download interface.
 * Currently uses Supabase Storage. When scaling:
 * - Switch to Cloudflare R2 when Storage cost > $50/month
 * - Change implementation here — all screens stay the same
 *
 * Buckets:
 * - photo-reports: Stage photo reports from masters
 * - review-photos: Client review photos
 * - chat-attachments: Chat file/image attachments
 * - avatars: User profile photos
 */

import { supabase } from '../lib/supabase';

export type StorageBucket = 'photo-reports' | 'review-photos' | 'chat-attachments' | 'avatars';

/**
 * Upload a file to storage.
 *
 * @param bucket - Target bucket name
 * @param path - File path within bucket (e.g. "reviews/project-123/photo.jpg")
 * @param fileUri - Local file URI to upload
 * @param contentType - MIME type (default: "image/jpeg")
 * @returns Public URL of the uploaded file, or null on failure
 */
export const uploadFile = async (
  bucket: StorageBucket,
  path: string,
  fileUri: string,
  contentType: string = 'image/jpeg',
): Promise<string | null> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { contentType, upsert: false });

    if (error) {
      console.warn(`[StorageService] Upload failed: ${error.message}`);
      return null;
    }

    return getPublicUrl(bucket, path);
  } catch (err) {
    console.warn('[StorageService] Upload error:', err);
    return null;
  }
};

/**
 * Get public URL for a file.
 */
export const getPublicUrl = (bucket: StorageBucket, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete a file from storage.
 */
export const deleteFile = async (
  bucket: StorageBucket,
  path: string,
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return !error;
  } catch {
    return false;
  }
};

/**
 * Upload multiple files and return their public URLs.
 *
 * @param bucket - Target bucket
 * @param files - Array of { uri, path } objects
 * @returns Array of public URLs (failed uploads are skipped)
 */
export const uploadMultiple = async (
  bucket: StorageBucket,
  files: Array<{ uri: string; path: string }>,
): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    const url = await uploadFile(bucket, file.path, file.uri);
    if (url) urls.push(url);
  }

  return urls;
};

/**
 * Generate a unique file path for uploads.
 *
 * @param prefix - Path prefix (e.g. "reviews/project-123")
 * @param extension - File extension (default: "jpg")
 * @returns Path like "reviews/project-123/1709234567890-a3f2.jpg"
 */
export const generateFilePath = (prefix: string, extension: string = 'jpg'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}/${timestamp}-${random}.${extension}`;
};
