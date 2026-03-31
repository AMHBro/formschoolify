function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getDateStamp(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getExt(filename = "") {
  const parts = filename.split(".");
  if (parts.length < 2) return "bin";
  return parts.at(-1).toLowerCase();
}

export function buildSmartFilename({
  namingPattern = ["fullName", "section", "documentType"],
  answers = {},
  fallbackFieldLabel = "file",
  originalName = "upload.bin",
}) {
  const segments = namingPattern
    .map((key) => sanitizeSegment(answers[key]))
    .filter(Boolean);

  if (segments.length === 0) {
    segments.push(sanitizeSegment(fallbackFieldLabel) || "file");
  }

  const base = segments.join("_");
  return `${base}_${getDateStamp()}.${getExt(originalName)}`;
}

