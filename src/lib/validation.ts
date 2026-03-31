export type AllowedFieldType = "text" | "image" | "pdf" | "file";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PDF_MIME_TYPES = new Set(["application/pdf"]);

export function validateMimeType(
  fieldType: AllowedFieldType,
  mimeType: string,
  allowListForFileType?: string[],
): boolean {
  if (fieldType === "image") return IMAGE_MIME_TYPES.has(mimeType);
  if (fieldType === "pdf") return PDF_MIME_TYPES.has(mimeType);
  if (fieldType === "file") {
    if (!allowListForFileType || allowListForFileType.length === 0) return true;
    return allowListForFileType.includes(mimeType);
  }
  return false;
}

