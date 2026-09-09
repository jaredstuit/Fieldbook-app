"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/lib/org";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function pacificLocalToIso(value: string) {
  // datetime-local has no timezone. Interpret it as America/Los_Angeles before storing UTC.
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(value).toISOString();
  const parts = m.slice(1).map(Number);
  const guess = Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]||0);
  const zone = new Intl.DateTimeFormat("en-US", { timeZone:"America/Los_Angeles", timeZoneName:"shortOffset" }).formatToParts(new Date(guess)).find(p=>p.type==="timeZoneName")?.value || "GMT-8";
  const z = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const offset = z ? (z[1] === "+" ? 1 : -1) * (Number(z[2])*60 + Number(z[3]||0)) : -480;
  return new Date(guess - offset*60000).toISOString();
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
    water_source_id: text(formData, "water_source_id"),
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
    observed_at: observedAt ? pacificLocalToIso(observedAt) : new Date().toISOString(),
    note,
    tags
  });
  if (error) throw error;
  revalidatePath(`/fields/${fieldId}`);
  redirect(`/fields/${fieldId}/timeline`);
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
    observed_at: observedAt ? pacificLocalToIso(observedAt) : new Date().toISOString(),
    observation_type: text(formData, "observation_type") || "Field observation",
    note,
    rating
  });
  if (error) throw error;
  revalidatePath(`/fields/${fieldId}`);
  redirect(`/fields/${fieldId}/timeline`);
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
  redirect(`/fields/${fieldId}/samples`);
}


export async function updateGrower(formData: FormData) {
  const { supabase } = await getCurrentOrganization(); const id=text(formData,"grower_id"); const name=text(formData,"name"); if(!id||!name) throw new Error("Grower and name are required.");
  const {error}=await supabase.from("growers").update({name,contact_name:text(formData,"contact_name"),phone:text(formData,"phone"),email:text(formData,"email"),notes:text(formData,"notes")}).eq("id",id); if(error) throw error; revalidatePath(`/growers/${id}`); redirect(`/growers/${id}`);
}
export async function updateRanch(formData: FormData) {
  const { supabase } = await getCurrentOrganization(); const id=text(formData,"ranch_id"); const growerId=text(formData,"grower_id"); const name=text(formData,"name"); if(!id||!growerId||!name) throw new Error("Ranch and name are required.");
  const {error}=await supabase.from("ranches").update({name,notes:text(formData,"notes")}).eq("id",id); if(error) throw error; revalidatePath(`/growers/${growerId}`); redirect(`/growers/${growerId}`);
}
export async function updateField(formData: FormData) {
  const { supabase } = await getCurrentOrganization(); const id=text(formData,"field_id"); const name=text(formData,"name"); if(!id||!name) throw new Error("Field and name are required.");
  const {error}=await supabase.from("fields").update({name,acres:numberOrNull(formData.get("acres")),current_crop:text(formData,"current_crop"),variety:text(formData,"variety"),rootstock:text(formData,"rootstock"),planting_year:numberOrNull(formData.get("planting_year")),irrigation_type:text(formData,"irrigation_type"),water_source_id:text(formData,"water_source_id"),notes:text(formData,"notes"),updated_at:new Date().toISOString()}).eq("id",id); if(error) throw error; revalidatePath(`/fields/${id}`); redirect(`/fields/${id}`);
}
export async function updateFieldNote(formData: FormData) {
 const {supabase}=await getCurrentOrganization();const id=text(formData,"note_id"),fieldId=text(formData,"field_id"),note=text(formData,"note"),observed=text(formData,"observed_at");if(!id||!fieldId||!note)throw new Error("Missing note information.");const tags=(text(formData,"tags")||"").split(",").map(x=>x.trim()).filter(Boolean);const {error}=await supabase.from("field_notes").update({note,tags,...(observed?{observed_at:pacificLocalToIso(observed)}:{})}).eq("id",id);if(error)throw error;revalidatePath(`/fields/${fieldId}/notes`);redirect(`/fields/${fieldId}/notes`);
}
export async function updateObservation(formData: FormData) {
 const {supabase}=await getCurrentOrganization();const id=text(formData,"observation_id"),fieldId=text(formData,"field_id"),note=text(formData,"note"),observed=text(formData,"observed_at");if(!id||!fieldId||!note)throw new Error("Missing observation information.");const {error}=await supabase.from("observations").update({note,observation_type:text(formData,"observation_type")||"Field observation",rating:numberOrNull(formData.get("rating")),...(observed?{observed_at:pacificLocalToIso(observed)}:{})}).eq("id",id);if(error)throw error;revalidatePath(`/fields/${fieldId}/notes`);redirect(`/fields/${fieldId}/notes`);
}
export async function updateSample(formData: FormData) {
 const {supabase}=await getCurrentOrganization();const id=text(formData,"sample_id"),fieldId=text(formData,"field_id"),sampleType=text(formData,"sample_type"),sampledAt=text(formData,"sampled_at");if(!id||!fieldId||!sampleType||!sampledAt)throw new Error("Missing sample information.");let {error}=await supabase.from("samples").update({sample_type:sampleType,sampled_at:sampledAt,lab_name:text(formData,"lab_name"),sample_label:text(formData,"sample_label"),notes:text(formData,"notes")}).eq("id",id);if(error)throw error;error=(await supabase.from("sample_results").delete().eq("sample_id",id)).error;if(error)throw error;const analytes=formData.getAll("analyte").map(v=>String(v).trim()),values=formData.getAll("result_value").map(v=>String(v).trim()),units=formData.getAll("unit").map(v=>String(v).trim()),qualifiers=formData.getAll("qualifier").map(v=>String(v).trim());const rows:any[]=[];for(let i=0;i<analytes.length;i++){if(!analytes[i])continue;const raw=values[i]||"",num=raw===""?null:Number(raw);rows.push({sample_id:id,analyte:analytes[i],value:num!==null&&Number.isFinite(num)?num:null,text_value:num===null||Number.isFinite(num)?null:raw,unit:units[i]||null,qualifier:qualifiers[i]||null});}if(rows.length){const r=await supabase.from("sample_results").insert(rows);if(r.error)throw r.error;}revalidatePath(`/fields/${fieldId}/samples`);revalidatePath('/samples');redirect(`/fields/${fieldId}/samples`);
}
