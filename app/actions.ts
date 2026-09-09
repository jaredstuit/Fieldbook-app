"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/lib/org";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function createGrower(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  if (!organization) throw new Error("No organization membership found for this account.");
  const name = text(formData, "name");
  if (!name) throw new Error("Grower name is required.");

  const { data, error } = await supabase.from("growers").insert({
    organization_id: organization.id,
    name,
    contact_name: text(formData, "contact_name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    notes: text(formData, "notes")
  }).select("id").single();

  if (error) throw error;
  revalidatePath("/");
  redirect(`/growers/${data.id}`);
}

export async function createRanch(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  if (!organization) throw new Error("No organization membership found for this account.");
  const growerId = text(formData, "grower_id");
  const name = text(formData, "name");
  if (!growerId || !name) throw new Error("Grower and ranch name are required.");

  const { data, error } = await supabase.from("ranches").insert({
    organization_id: organization.id,
    grower_id: growerId,
    name,
    notes: text(formData, "notes")
  }).select("id").single();

  if (error) throw error;
  revalidatePath(`/growers/${growerId}`);
  redirect(`/ranches/${data.id}/fields/new`);
}

export async function createField(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  if (!organization) throw new Error("No organization membership found for this account.");
  const ranchId = text(formData, "ranch_id");
  const name = text(formData, "name");
  if (!ranchId || !name) throw new Error("Ranch and field name are required.");

  const rawYear = text(formData, "planting_year");
  const rawAcres = text(formData, "acres");
  const { data, error } = await supabase.from("fields").insert({
    organization_id: organization.id,
    ranch_id: ranchId,
    name,
    acres: rawAcres ? Number(rawAcres) : null,
    current_crop: text(formData, "current_crop"),
    variety: text(formData, "variety"),
    rootstock: text(formData, "rootstock"),
    planting_year: rawYear ? Number(rawYear) : null,
    irrigation_type: text(formData, "irrigation_type"),
    notes: text(formData, "notes")
  }).select("id").single();

  if (error) throw error;
  revalidatePath("/");
  redirect(`/fields/${data.id}`);
}

export async function createFieldNote(formData: FormData) {
  const { supabase, organization, userId } = await getCurrentOrganization();
  if (!organization || !userId) throw new Error("You must be signed in.");
  const fieldId = text(formData, "field_id");
  const note = text(formData, "note");
  if (!fieldId || !note) throw new Error("Field and note are required.");

  const tagText = text(formData, "tags") || "";
  const tags = tagText.split(",").map(v => v.trim()).filter(Boolean);
  const observedAt = text(formData, "observed_at");

  const { error } = await supabase.from("field_notes").insert({
    organization_id: organization.id,
    field_id: fieldId,
    author_id: userId,
    observed_at: observedAt ? new Date(observedAt).toISOString() : new Date().toISOString(),
    note,
    tags
  });
  if (error) throw error;
  revalidatePath(`/fields/${fieldId}`);
  redirect(`/fields/${fieldId}#timeline`);
}

export async function createObservation(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  if (!organization) throw new Error("No organization membership found for this account.");
  const fieldId = text(formData, "field_id");
  const note = text(formData, "note");
  if (!fieldId || !note) throw new Error("Field and observation are required.");

  const observedAt = text(formData, "observed_at");
  const rating = numberOrNull(formData.get("rating"));
  const { error } = await supabase.from("observations").insert({
    organization_id: organization.id,
    field_id: fieldId,
    application_id: null,
    observed_at: observedAt ? new Date(observedAt).toISOString() : new Date().toISOString(),
    observation_type: text(formData, "observation_type") || "Field observation",
    note,
    rating
  });
  if (error) throw error;
  revalidatePath(`/fields/${fieldId}`);
  redirect(`/fields/${fieldId}#timeline`);
}

export async function createSample(formData: FormData) {
  const { supabase, organization } = await getCurrentOrganization();
  if (!organization) throw new Error("No organization membership found for this account.");
  const fieldId = text(formData, "field_id");
  const sampleType = text(formData, "sample_type");
  const sampledAt = text(formData, "sampled_at");
  if (!fieldId || !sampleType || !sampledAt) throw new Error("Field, sample type, and sample date are required.");

  const { data: sample, error } = await supabase.from("samples").insert({
    organization_id: organization.id,
    field_id: fieldId,
    sample_type: sampleType,
    sampled_at: sampledAt,
    lab_name: text(formData, "lab_name"),
    sample_label: text(formData, "sample_label"),
    notes: text(formData, "notes")
  }).select("id").single();
  if (error) throw error;

  const analytes = formData.getAll("analyte").map(v => String(v).trim());
  const values = formData.getAll("result_value").map(v => String(v).trim());
  const units = formData.getAll("unit").map(v => String(v).trim());
  const qualifiers = formData.getAll("qualifier").map(v => String(v).trim());

  const results: Array<{
    sample_id: string;
    analyte: string;
    value: number | null;
    text_value: string | null;
    unit: string | null;
    qualifier: string | null;
  }> = [];

  for (let i = 0; i < analytes.length; i++) {
    const analyte = analytes[i];
    if (!analyte) continue;
    const rawValue = values[i] || "";
    const parsed = rawValue === "" ? null : Number(rawValue);
    results.push({
      sample_id: sample.id,
      analyte,
      value: parsed !== null && Number.isFinite(parsed) ? parsed : null,
      text_value: parsed === null || Number.isFinite(parsed) ? null : rawValue,
      unit: units[i] || null,
      qualifier: qualifiers[i] || null
    });
  }

  if (results.length) {
    const { error: resultsError } = await supabase.from("sample_results").insert(results);
    if (resultsError) throw resultsError;
  }

  revalidatePath(`/fields/${fieldId}`);
  revalidatePath("/samples");
  redirect(`/fields/${fieldId}#samples`);
}
