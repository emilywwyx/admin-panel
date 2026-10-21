import "server-only";
import { getDb } from "@/lib/auth";
import {
  CAPTION_COLUMNS,
  IMAGE_COLUMNS,
  PROFILE_COLUMNS,
  REQUEST_COLUMNS,
  type CaptionRow,
  type ImageRow,
  type Profile,
  type RequestRow,
  type VoteRow,
} from "@/lib/types";

export const PAGE_SIZE = 24;

// Supabase caps every response at 1,000 rows, so read whole tables in pages.
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>
): Promise<T[]> {
  const rows: T[] = [];
  const size = 1000;

  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data ?? []) as T[]));

    if (!data || data.length < size) {
      return rows;
    }
  }
}

function pageRange(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}

async function getProfilesById(ids: string[]): Promise<Map<string, Profile>> {
  const unique = [...new Set(ids.filter(Boolean))];

  if (unique.length === 0) {
    return new Map();
  }

  const { db } = await getDb();
  const { data } = await db.from("profiles").select(PROFILE_COLUMNS).in("id", unique);

  return new Map(((data ?? []) as Profile[]).map((profile) => [profile.id, profile]));
}

// ---------- Users ----------

export interface UserListItem extends Profile {
  email: string | null;
  photos: number;
  generations: number;
  votesCast: number;
  lastActive: string | null;
}

async function getEmails(): Promise<Map<string, string>> {
  const { db } = await getDb();
  const emails = new Map<string, string>();

  // Only works with the secret key; without it emails are simply not shown.
  try {
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });

      if (error || !data) {
        break;
      }

      data.users.forEach((user) => user.email && emails.set(user.id, user.email));

      if (data.users.length < 1000) {
        break;
      }
    }
  } catch {
    // ignore
  }

  return emails;
}

export async function getUsers({
  query,
  role,
  page,
}: {
  query: string;
  role: "all" | "admins";
  page: number;
}) {
  const { db } = await getDb();

  const [profiles, images, requests, votes, emails] = await Promise.all([
    fetchAll<Profile>((from, to) =>
      db.from("profiles").select(PROFILE_COLUMNS).order("created_at", { ascending: false }).range(from, to)
    ),
    fetchAll<{ created_by: string | null; created_at: string }>((from, to) =>
      db.from("images").select("created_by, created_at").order("id").range(from, to)
    ),
    fetchAll<{ created_by: string | null; created_at: string }>((from, to) =>
      db.from("caption_requests").select("created_by, created_at").order("id").range(from, to)
    ),
    fetchAll<{ user_id: string; created_at: string }>((from, to) =>
      db.from("caption_votes").select("user_id, created_at").order("id").range(from, to)
    ),
    getEmails(),
  ]);

  const tally = new Map<string, { photos: number; generations: number; votesCast: number; lastActive: string | null }>();

  function bump(id: string | null, key: "photos" | "generations" | "votesCast", at: string) {
    if (!id) return;
    const entry = tally.get(id) ?? { photos: 0, generations: 0, votesCast: 0, lastActive: null };
    entry[key] += 1;
    if (!entry.lastActive || at > entry.lastActive) entry.lastActive = at;
    tally.set(id, entry);
  }

  images.forEach((row) => bump(row.created_by, "photos", row.created_at));
  requests.forEach((row) => bump(row.created_by, "generations", row.created_at));
  votes.forEach((row) => bump(row.user_id, "votesCast", row.created_at));

  const needle = query.trim().toLowerCase();

  const all: UserListItem[] = profiles.map((profile) => ({
    ...profile,
    email: emails.get(profile.id) ?? null,
    photos: 0,
    generations: 0,
    votesCast: 0,
    lastActive: null,
    ...tally.get(profile.id),
  }));

  const filtered = all.filter((user) => {
    if (role === "admins" && !user.is_superadmin) return false;
    if (!needle) return true;

    return [user.first_name, user.last_name, user.email, user.id]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(needle));
  });

  const { from, to } = pageRange(page);

  return {
    users: filtered.slice(from, to + 1),
    total: filtered.length,
    totals: {
      all: all.length,
      admins: all.filter((user) => user.is_superadmin).length,
      active: all.filter((user) => user.photos + user.generations + user.votesCast > 0).length,
    },
    hasEmails: emails.size > 0,
  };
}

// ---------- Media ----------

export interface MediaListItem extends ImageRow {
  captions: Pick<CaptionRow, "id" | "content" | "score" | "upvotes" | "downvotes">[];
  uploader: Profile | null;
}

export async function getMediaList({
  query,
  vibe,
  page,
}: {
  query: string;
  vibe: string | null;
  page: number;
}) {
  const { db } = await getDb();
  const { from, to } = pageRange(page);

  let request = db
    .from("images")
    .select(`${IMAGE_COLUMNS}, captions(id, content, score, upvotes, downvotes)`, { count: "exact" })
    .order("created_at", { ascending: false });

  if (vibe) {
    request = request.eq("vibe", vibe);
  }

  if (query.trim()) {
    request = request.ilike("neighborhood", `%${query.trim().replace(/[%_,()]/g, "")}%`);
  }

  const { data, count, error } = await request.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as (ImageRow & { captions: MediaListItem["captions"] | null })[];
  const uploaders = await getProfilesById(rows.map((row) => row.created_by ?? ""));

  const items: MediaListItem[] = rows.map((row) => ({
    ...row,
    captions: [...(row.captions ?? [])].sort((a, b) => b.score - a.score),
    uploader: row.created_by ? uploaders.get(row.created_by) ?? null : null,
  }));

  return { items, total: count ?? 0 };
}

export async function getMedia(id: number) {
  const { db } = await getDb();

  const { data: image } = await db.from("images").select(IMAGE_COLUMNS).eq("id", id).maybeSingle();

  if (!image) {
    return null;
  }

  const [{ data: captions }, { data: requests }] = await Promise.all([
    db
      .from("captions")
      .select(CAPTION_COLUMNS)
      .eq("image_id", id)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true }),
    db
      .from("caption_requests")
      .select(REQUEST_COLUMNS)
      .eq("image_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const row = image as ImageRow;
  const uploaders = await getProfilesById([row.created_by ?? ""]);

  return {
    image: row,
    uploader: row.created_by ? uploaders.get(row.created_by) ?? null : null,
    captions: (captions ?? []) as CaptionRow[],
    requests: (requests ?? []) as RequestRow[],
  };
}

// ---------- Votes ----------

export interface VoteListItem extends VoteRow {
  caption: (Pick<CaptionRow, "id" | "content" | "image_id" | "vibe" | "score"> & {
    image: Pick<ImageRow, "image_url" | "neighborhood"> | null;
  }) | null;
  voter: Profile | null;
}

export type VoteFilter = "all" | "up" | "down";

export async function getVotes({ filter, page }: { filter: VoteFilter; page: number }) {
  const { db } = await getDb();
  const { from, to } = pageRange(page);

  let request = db
    .from("caption_votes")
    .select(
      "id, caption_id, user_id, vote, created_at, caption:captions(id, content, image_id, vibe, score, image:images(image_url, neighborhood))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    request = request.eq("vote", filter === "up" ? 1 : -1);
  }

  const [{ data, count, error }, { count: up }, { count: down }] = await Promise.all([
    request.range(from, to),
    db.from("caption_votes").select("id", { count: "exact", head: true }).eq("vote", 1),
    db.from("caption_votes").select("id", { count: "exact", head: true }).eq("vote", -1),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as Omit<VoteListItem, "voter">[];
  const voters = await getProfilesById(rows.map((row) => row.user_id));

  return {
    votes: rows.map((row) => ({ ...row, voter: voters.get(row.user_id) ?? null })),
    total: count ?? 0,
    up: up ?? 0,
    down: down ?? 0,
  };
}

export type RankedCaption = CaptionRow & { image: Pick<ImageRow, "image_url" | "neighborhood"> | null };

export async function getCaptionRankings() {
  const { db } = await getDb();
  const columns = `${CAPTION_COLUMNS}, image:images(image_url, neighborhood)`;

  const [{ data: top }, { data: bottom }] = await Promise.all([
    db.from("captions").select(columns).order("score", { ascending: false }).order("upvotes", { ascending: false }).limit(5),
    db.from("captions").select(columns).gt("downvotes", 0).order("score", { ascending: true }).order("downvotes", { ascending: false }).limit(5),
  ]);

  return {
    top: (top ?? []) as unknown as RankedCaption[],
    bottom: (bottom ?? []) as unknown as RankedCaption[],
  };
}
