"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/auth";
import { withParams } from "@/lib/params";
import { isVibe } from "@/lib/vibes";

const BUCKET = "caption-images";
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function id(formData: FormData, key: string): number {
  const value = Number(text(formData, key));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${key}.`);
  }

  return value;
}

function fail(path: string, message: string): never {
  redirect(withParams(path, { error: message }));
}

function done(path: string, notice: string): never {
  revalidatePath("/", "layout");
  redirect(withParams(path, { notice }));
}

// ---------- Images ----------

export async function createImage(formData: FormData) {
  const { admin, db } = await getDb();
  const back = "/media/new";

  const vibe = text(formData, "vibe");
  const neighborhood = text(formData, "neighborhood").slice(0, 40) || null;
  const imageUrl = text(formData, "image_url");
  const file = formData.get("file");

  if (!isVibe(vibe)) {
    fail(back, "Pick a vibe.");
  }

  let publicUrl = imageUrl;
  let storagePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    const extension = IMAGE_TYPES[file.type];

    if (!extension) {
      fail(back, "Photos need to be JPG, PNG, or WebP.");
    }

    storagePath = `${admin.id}/${Date.now()}.${extension}`;

    const { error } = await db.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type });

    if (error) {
      fail(back, `Upload failed: ${error.message}`);
    }

    publicUrl = db.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  } else if (!/^https?:\/\//.test(imageUrl)) {
    fail(back, "Upload a photo or paste an image URL.");
  }

  const { data, error } = await db
    .from("images")
    .insert({
      image_url: publicUrl,
      storage_path: storagePath,
      vibe,
      neighborhood,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (storagePath) {
      await db.storage.from(BUCKET).remove([storagePath]);
    }

    fail(back, `Could not save the photo: ${error?.message ?? "unknown error"}`);
  }

  done(`/media/${data.id}`, "Photo created.");
}

export async function updateImage(formData: FormData) {
  const { db } = await getDb();
  const imageId = id(formData, "id");
  const back = `/media/${imageId}`;

  const vibe = text(formData, "vibe");
  const imageUrl = text(formData, "image_url");

  if (!isVibe(vibe)) {
    fail(back, "Pick a vibe.");
  }

  if (!/^https?:\/\//.test(imageUrl)) {
    fail(back, "The image URL must start with http:// or https://.");
  }

  const { error } = await db
    .from("images")
    .update({
      vibe,
      image_url: imageUrl,
      neighborhood: text(formData, "neighborhood").slice(0, 40) || null,
    })
    .eq("id", imageId);

  if (error) {
    fail(back, `Could not update the photo: ${error.message}`);
  }

  done(back, "Photo updated.");
}

export async function deleteImage(formData: FormData) {
  const { db } = await getDb();
  const imageId = id(formData, "id");
  const back = `/media/${imageId}`;

  const { data: image } = await db.from("images").select("storage_path").eq("id", imageId).maybeSingle();
  const { data: captions } = await db.from("captions").select("id").eq("image_id", imageId);
  const captionIds = (captions ?? []).map((caption) => caption.id as number);

  // Children first, in case the foreign keys don't cascade.
  const steps = [
    captionIds.length > 0 ? () => db.from("caption_votes").delete().in("caption_id", captionIds) : null,
    () => db.from("captions").delete().eq("image_id", imageId),
    () => db.from("caption_requests").delete().eq("image_id", imageId),
    () => db.from("images").delete().eq("id", imageId),
  ];

  for (const step of steps) {
    if (!step) continue;
    const { error } = await step();

    if (error) {
      fail(back, `Could not delete the photo: ${error.message}`);
    }
  }

  if (image?.storage_path) {
    await db.storage.from(BUCKET).remove([image.storage_path]);
  }

  done("/media", "Photo and its captions deleted.");
}

// ---------- Captions ----------

export async function createCaption(formData: FormData) {
  const { admin, db } = await getDb();
  const imageId = id(formData, "image_id");
  const back = `/media/${imageId}`;
  const content = text(formData, "content");
  const vibe = text(formData, "vibe");

  if (!content) {
    fail(back, "Captions can’t be empty.");
  }

  if (!isVibe(vibe)) {
    fail(back, "Pick a vibe.");
  }

  const { error } = await db
    .from("captions")
    .insert({ image_id: imageId, content: content.slice(0, 500), vibe, created_by: admin.id });

  if (error) {
    fail(back, `Could not add the caption: ${error.message}`);
  }

  done(back, "Caption added.");
}

export async function updateCaption(formData: FormData) {
  const { db } = await getDb();
  const captionId = id(formData, "id");
  const back = `/media/${id(formData, "image_id")}`;
  const content = text(formData, "content");
  const vibe = text(formData, "vibe");

  if (!content) {
    fail(back, "Captions can’t be empty.");
  }

  if (!isVibe(vibe)) {
    fail(back, "Pick a vibe.");
  }

  const { error } = await db.from("captions").update({ content: content.slice(0, 500), vibe }).eq("id", captionId);

  if (error) {
    fail(back, `Could not update the caption: ${error.message}`);
  }

  done(back, "Caption updated.");
}

export async function deleteCaption(formData: FormData) {
  const { db } = await getDb();
  const captionId = id(formData, "id");
  const back = `/media/${id(formData, "image_id")}`;

  const { error: votesError } = await db.from("caption_votes").delete().eq("caption_id", captionId);
  const { error } = votesError ? { error: votesError } : await db.from("captions").delete().eq("id", captionId);

  if (error) {
    fail(back, `Could not delete the caption: ${error.message}`);
  }

  done(back, "Caption deleted.");
}
