import { createClient } from "@/lib/supabase/server";

export async function getCurrentOrganization() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { supabase, userId: null, organization: null };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id,name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const rawOrg = membership?.organizations as unknown;
  const organization = Array.isArray(rawOrg) ? rawOrg[0] ?? null : rawOrg ?? null;
  return { supabase, userId, organization: organization as { id: string; name: string } | null, role: membership?.role ?? null };
}
