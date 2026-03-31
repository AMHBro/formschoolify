type BuildStoredFileNameInput = {
  studentName: string;
  fieldLabel: string;
  extension: string;
  date?: Date;
  shortId?: string;
};

function sanitizeSegment(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatUtcDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function generateShortId(length = 4): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function buildStoredFileName({
  studentName,
  fieldLabel,
  extension,
  date = new Date(),
  shortId = generateShortId(),
}: BuildStoredFileNameInput): string {
  const student = sanitizeSegment(studentName) || "Student";
  const field = sanitizeSegment(fieldLabel) || "Field";
  const ext = extension.replace(/^\./, "").toLowerCase() || "bin";
  const day = formatUtcDate(date);
  return `${student}_${field}_${day}_${shortId}.${ext}`;
}

