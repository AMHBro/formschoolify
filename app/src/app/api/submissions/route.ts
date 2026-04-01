import { getSupabaseServerClient } from "@/lib/supabaseServer";

const UPLOAD_BUCKET = "student-uploads";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureUploadBucket() {
  const supabase = getSupabaseServerClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  const exists = !error && buckets?.some((bucket) => bucket.name === UPLOAD_BUCKET);
  if (exists) {
    return;
  }
  await supabase.storage.createBucket(UPLOAD_BUCKET, { public: true });
}

/** Undici/Node may not use the same `File` constructor as `instanceof File`. */
function isNonEmptyUploadPart(value: FormDataEntryValue): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number" &&
    (value as Blob).size > 0
  );
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const contentType = request.headers.get("content-type") ?? "";
  let formToken = "";
  let studentName = "";
  let answers: Record<string, unknown> = {};

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    const formData = await request.formData();
    formToken = String(formData.get("formToken") ?? "");
    studentName = String(formData.get("studentName") ?? "");
    const answersRaw = String(formData.get("answers") ?? "{}");
    try {
      answers = JSON.parse(answersRaw);
    } catch {
      answers = {};
    }

    await ensureUploadBucket();
    // Do not use formData.entries() for repeated keys: some runtimes only yield one part per name.
    const uploadsByField = new Map<string, Blob[]>();
    const fileKeys = new Set<string>();
    for (const key of formData.keys()) {
      if (key.startsWith("file_")) {
        fileKeys.add(key);
      }
    }
    for (const key of fileKeys) {
      const fieldId = key.slice("file_".length);
      if (!fieldId) continue;
      const parts = formData.getAll(key);
      const list: Blob[] = [];
      for (const value of parts) {
        if (isNonEmptyUploadPart(value)) {
          list.push(value);
        }
      }
      if (list.length) {
        uploadsByField.set(fieldId, list);
      }
    }

    const uploadStamp = Date.now();
    for (const [fieldId, fileList] of uploadsByField) {
      const uploadedItems: Array<{
        kind: "file";
        name: string;
        url: string;
        size: number;
        mimeType: string;
      }> = [];
      for (let i = 0; i < fileList.length; i++) {
        const value = fileList[i];
        const originalName =
          typeof (value as File).name === "string" && (value as File).name
            ? (value as File).name
            : `${fieldId}.bin`;
        const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
        const path = `${formToken}/${uploadStamp}-${i}-${fieldId}-${sanitizeFileName(studentName)}.${ext}`;
        const bytes = Buffer.from(await value.arrayBuffer());
        const { error: uploadError } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, bytes, {
          contentType: value.type || "application/octet-stream",
          upsert: false,
        });
        if (uploadError) {
          return Response.json({ error: "Failed to upload file." }, { status: 500 });
        }
        const { data: publicUrlData } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
        uploadedItems.push({
          kind: "file",
          name: originalName,
          url: publicUrlData.publicUrl,
          size: value.size,
          mimeType: value.type || "application/octet-stream",
        });
      }
      if (uploadedItems.length === 1) {
        answers[fieldId] = uploadedItems[0];
      } else {
        answers[fieldId] = { kind: "files", items: uploadedItems };
      }
    }
  } else {
    const body = await request.json();
    formToken = String(body.formToken ?? "");
    studentName = String(body.studentName ?? "");
    answers = typeof body.answers === "object" && body.answers ? body.answers : {};
  }

  if (!formToken || !studentName) {
    return Response.json({ error: "formToken and studentName are required." }, { status: 400 });
  }

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("token, is_open")
    .eq("token", String(formToken))
    .maybeSingle();
  if (formError) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }
  if (!form || !form.is_open) {
    return Response.json({ error: "Form is unavailable." }, { status: 404 });
  }

  const { data: submission, error: insertError } = await supabase
    .from("submissions")
    .insert({
      form_token: String(formToken),
      student_name: String(studentName),
      answers_json: answers,
    })
    .select("id, form_token, student_name, answers_json, created_at")
    .single();
  if (insertError || !submission) {
    return Response.json({ error: "Failed to create submission." }, { status: 500 });
  }

  return Response.json(
    {
      submission: {
        id: String(submission.id),
        formToken: submission.form_token,
        studentName: submission.student_name,
        answers: submission.answers_json,
        createdAt: submission.created_at,
      },
    },
    { status: 201 },
  );
}

