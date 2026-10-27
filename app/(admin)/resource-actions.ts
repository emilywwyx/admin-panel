"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/auth";
import { withParams } from "@/lib/params";
import { getResource, type Resource } from "@/lib/resources";

function load(formData: FormData): Resource {
  const resource = getResource(String(formData.get("resource") ?? ""));

  if (!resource) {
    throw new Error("Unknown resource.");
  }

  return resource;
}

function rowId(formData: FormData): number | null {
  const value = Number(formData.get("id"));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function friendly(resource: Resource, error: { code?: string; message: string }): string {
  if (error.code === "23505") return `That ${resource.singular} already exists.`;
  if (error.code === "23503") return `This ${resource.singular} is still used somewhere else, so it can’t be removed.`;
  if (error.code === "23514") return "One of the values isn’t allowed.";
  return error.message;
}

function parse(resource: Resource, formData: FormData): Record<string, unknown> | string {
  const values: Record<string, unknown> = {};

  for (const field of resource.fields) {
    if (field.type === "checkbox") {
      values[field.name] = formData.has(field.name);
      continue;
    }

    let raw = String(formData.get(field.name) ?? "").trim();

    if (field.lowercase) raw = raw.toLowerCase();

    if (!raw) {
      if (field.required) return `${field.label} is required.`;
      values[field.name] = null;
      continue;
    }

    if (field.type === "number" || field.optionsFrom) {
      const number = Number(raw);
      if (!Number.isFinite(number)) return `${field.label} must be a number.`;
      values[field.name] = number;
    } else if (field.options && !field.options.some((option) => option.value === raw)) {
      return `Pick a valid ${field.label.toLowerCase()}.`;
    } else {
      values[field.name] = raw.slice(0, 2000);
    }
  }

  return values;
}

export async function saveResource(formData: FormData) {
  const { db } = await getDb();
  const resource = load(formData);
  const id = rowId(formData);
  const values = parse(resource, formData);

  if (typeof values === "string") {
    redirect(withParams(resource.path, { edit: id, error: values }));
  }

  const { error } = id
    ? await db.from(resource.table).update(values).eq("id", id)
    : await db.from(resource.table).insert(values);

  if (error) {
    redirect(withParams(resource.path, { edit: id, error: friendly(resource, error) }));
  }

  revalidatePath(resource.path);
  redirect(withParams(resource.path, { notice: `${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} ${id ? "updated" : "created"}.` }));
}

export async function deleteResource(formData: FormData) {
  const { db } = await getDb();
  const resource = load(formData);
  const id = rowId(formData);

  if (!id) {
    redirect(withParams(resource.path, { error: "Missing id." }));
  }

  const { error } = await db.from(resource.table).delete().eq("id", id);

  if (error) {
    redirect(withParams(resource.path, { error: friendly(resource, error) }));
  }

  revalidatePath(resource.path);
  redirect(withParams(resource.path, { notice: `${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} deleted.` }));
}
