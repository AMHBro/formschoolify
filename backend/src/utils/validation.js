const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FILE_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateUploadByFieldType(fieldType, mimeType) {
  if (fieldType === "image") return IMAGE_MIMES.has(mimeType);
  if (fieldType === "file") return FILE_MIMES.has(mimeType);
  return false;
}

