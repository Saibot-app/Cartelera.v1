import { supabase } from './supabaseClient';

const BUCKET = 'content-files';

// NO-OP to keep legacy calls from breaking
export async function ensureBucketExists(): Promise<void> {
  return; // Bucket is managed in Supabase, not on the client
}

export async function uploadUserFile(userId: string, file: File) {
  if (!userId) throw new Error('You must be logged in');
  const path = `content/${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Private bucket -> signed URL for display
  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (signErr) throw new Error(`Could not sign URL: ${signErr.message}`);

  return { path, url: data.signedUrl };
}

export async function getSignedUrl(path: string, expiresSec = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresSec);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function removeUserFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

// Backward-compat aliases
export async function uploadFile(userId: string, file: File) {
  return uploadUserFile(userId, file);
}

export async function deleteFile(path: string) {
  return removeUserFile(path);
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Default export to support `import StorageService from '@/lib/storage'`
const StorageService = {
  ensureBucketExists,
  uploadFile,
  uploadUserFile,
  getSignedUrl,
  deleteFile,
  removeUserFile,
  validateFileType,
  formatFileSize,
};

export default StorageService;