'use server';

import { del, put } from '@vercel/blob';

import { env } from './env';

export async function uploadBlobFile(path: string, file: File) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN nu este configurat.');
  }

  return put(path, file, {
    access: 'public',
    contentType: file.type,
    token: env.BLOB_READ_WRITE_TOKEN,
  });
}

export async function deleteBlobFile(url: string) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN nu este configurat.');
  }

  await del(url, { token: env.BLOB_READ_WRITE_TOKEN });
}

