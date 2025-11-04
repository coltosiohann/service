import { desc, eq } from 'drizzle-orm';

import { db, documents } from '@/db';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { ensureVehicleAccess } from '@/features/vehicles/service';
import { deleteBlobFile, uploadBlobFile } from '@/lib/blob';
import { uploadDocumentSchema } from './validators';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9.\-_]/gi, '_');
}

export async function uploadDocument(formData: FormData, userId: string) {
  const file = formData.get('file');

  if (!(file instanceof File)) {
    throw new ValidationError('Fișierul este obligatoriu.');
  }

  if (file.size === 0) {
    throw new ValidationError('Fișierul este gol.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError('Tip de fișier neacceptat. Folosiți PDF sau imagini.');
  }

  const raw = {
    orgId: formData.get('orgId'),
    vehicleId: formData.get('vehicleId'),
    kind: formData.get('kind'),
    expiresAt: formData.get('expiresAt') || undefined,
  };

  const parsed = uploadDocumentSchema.safeParse(raw);

  if (!parsed.success) {
    throw new ValidationError('Date document invalide.', parsed.error.flatten());
  }

  const data = parsed.data;
  await ensureVehicleAccess(data.orgId, data.vehicleId);

  const safeName = sanitizeFileName(file.name);
  const path = `documents/${data.vehicleId}/${Date.now()}-${safeName}`;

  const blob = await uploadBlobFile(path, file);

  const [record] = await db
    .insert(documents)
    .values({
      vehicleId: data.vehicleId,
      kind: data.kind,
      fileUrl: blob.url,
      fileName: file.name,
      uploadedBy: userId,
      expiresAt: data.expiresAt ?? null,
    })
    .returning();

  return record;
}

export async function listDocuments(vehicleId: string, orgId: string) {
  await ensureVehicleAccess(orgId, vehicleId);

  return db.query.documents.findMany({
    where: (fields, operators) => operators.eq(fields.vehicleId, vehicleId),
    orderBy: (fields) => desc(fields.uploadedAt),
  });
}

export async function deleteDocument(documentId: string, orgId: string) {
  const existing = await db.query.documents.findFirst({
    where: (fields, operators) => operators.eq(fields.id, documentId),
    with: {
      vehicle: true,
    },
  });

  if (!existing || existing.vehicle.deletedAt) {
    throw new NotFoundError('Documentul nu a fost găsit.');
  }

  if (existing.vehicle.orgId !== orgId) {
    throw new NotFoundError('Documentul nu aparține organizației selectate.');
  }

  await deleteBlobFile(existing.fileUrl);
  await db.delete(documents).where(eq(documents.id, documentId));

  return existing;
}
