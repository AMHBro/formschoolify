import { sha256 } from "@/lib/hash";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function ensureDefaultAdmin() {
  const supabase = getSupabaseServerClient();
  const { data: existing, error: selectError } = await supabase
    .from("admins")
    .select("id")
    .eq("username", "admin")
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("admins").insert({
      username: "admin",
      password_hash: sha256("admin123"),
    });
    if (insertError) {
      throw insertError;
    }
  }
}

