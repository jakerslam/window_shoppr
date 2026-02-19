"use client";

export type UploadCategory = "image" | "video" | "document";

export type UploadSecurityPolicy = {
  enabled: boolean;
  maxBytes: number;
  allowedMimeTypes: string[];
  quarantineRequired: boolean;
  signedUrlRequired: boolean;
};

const MB = 1024 * 1024;

const BASE_UPLOAD_POLICIES: Record<UploadCategory, UploadSecurityPolicy> = {
  image: {
    enabled: false, // Disabled until upload features are explicitly introduced.
    maxBytes: 8 * MB,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    quarantineRequired: true,
    signedUrlRequired: true,
  },
  video: {
    enabled: false, // Disabled until upload features are explicitly introduced.
    maxBytes: 64 * MB,
    allowedMimeTypes: ["video/mp4", "video/webm"],
    quarantineRequired: true,
    signedUrlRequired: true,
  },
  document: {
    enabled: false, // Disabled until upload features are explicitly introduced.
    maxBytes: 12 * MB,
    allowedMimeTypes: ["application/pdf"],
    quarantineRequired: true,
    signedUrlRequired: true,
  },
};

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Return immutable upload policy for a specific upload category.
 */
export const getUploadSecurityPolicy = (category: UploadCategory) => ({
  ...BASE_UPLOAD_POLICIES[category],
  allowedMimeTypes: [...BASE_UPLOAD_POLICIES[category].allowedMimeTypes],
});

/**
 * Validate upload metadata against policy before any transport request.
 */
export const validateUploadMetadata = ({
  category,
  mimeType,
  byteSize,
}: {
  category: UploadCategory;
  mimeType: string;
  byteSize: number;
}): UploadValidationResult => {
  const policy = getUploadSecurityPolicy(category);

  if (!policy.enabled) {
    return {
      ok: false,
      message: "Uploads are currently disabled.",
    };
  }

  if (!policy.allowedMimeTypes.includes(mimeType)) {
    return {
      ok: false,
      message: "This file type is not allowed.",
    };
  }

  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > policy.maxBytes) {
    return {
      ok: false,
      message: "This file exceeds the allowed size limit.",
    };
  }

  return { ok: true };
};

/**
 * Stub for future signed-URL upload flow contract.
 */
export const buildSignedUploadRequest = ({
  category,
  fileName,
  mimeType,
  byteSize,
}: {
  category: UploadCategory;
  fileName: string;
  mimeType: string;
  byteSize: number;
}) => ({
  category,
  fileName,
  mimeType,
  byteSize,
  requiresSignedUrl: true,
  requiresQuarantineScan: true,
});
