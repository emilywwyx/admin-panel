import "server-only";
import { getDb } from "@/lib/auth";
import { fetchAll } from "@/lib/data";
import { toDayKey, toWeekdayHour } from "@/lib/format";
import type { CaptionRow, ImageRow, Profile, RequestRow, VoteRow } from "@/lib/types";
import { VIBES, placeName, type Vibe } from "@/lib/vibes";

const DAY = 24 * 60 * 60 * 1000;
const TREND_DAYS = 30;

type Caption = Pick<CaptionRow, "id" | "image_id" | "content" | "vibe" | "upvotes" | "downvotes" | "score" | "created_at">;
type Image = Pick<ImageRow, "id" | "image_url" | "neighborhood" | "vibe" | "created_at" | "created_by">;
type Vote = Pick<VoteRow, "user_id" | "vote" | "created_at">;
type Request = Pick<RequestRow, "status" | "model" | "duration_ms" | "created_at">;
type Person = Pick<Profile, "id" | "first_name" | "last_name" | "created_at">;

export interface DayPoint {
  day: string;
  value: number;
}

export interface VibeStat {
  vibe: Vibe;
  captions: number;
  upvotes: number;
  downvotes: number;
  approval: number | null;
}

export interface PlaceStat {
  place: string;
  photos: number;
  upvotes: number;
  perPhoto: number;
}

export interface Leader {
  id: string;
  person: Person | null;
  value: number;
}

export interface FeaturedCaption extends Caption {
  image: Image | null;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function lastDays(count: number): string[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => toDayKey(new Date(now - (count - 1 - i) * DAY)));
}

function byDay(dates: string[], days: string[]): DayPoint[] {
  const counts = new Map(days.map((day) => [day, 0]));

  dates.forEach((iso) => {
    const key = toDayKey(iso);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  });

  return days.map((day) => ({ day, value: counts.get(day)! }));
}

function leaders(ids: (string | null)[], people: Map<string, Person>, limit = 5): Leader[] {
  const counts = new Map<string, number>();
  ids.forEach((id) => id && counts.set(id, (counts.get(id) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, value]) => ({ id, person: people.get(id) ?? null, value }));
}

export async function getDashboard() {
  const { db } = await getDb();

  const [captions, images, votes, requests, people] = await Promise.all([
    fetchAll<Caption>((from, to) =>
      db.from("captions").select("id, image_id, content, vibe, upvotes, downvotes, score, created_at").order("id").range(from, to)
    ),
    fetchAll<Image>((from, to) =>
      db.from("images").select("id, image_url, neighborhood, vibe, created_at, created_by").order("id").range(from, to)
    ),
    fetchAll<Vote>((from, to) =>
      db.from("caption_votes").select("user_id, vote, created_at").order("id").range(from, to)
    ),
    fetchAll<Request>((from, to) =>
      db.from("caption_requests").select("status, model, duration_ms, created_at").order("id").range(from, to)
    ),
    fetchAll<Person>((from, to) =>
      db.from("profiles").select("id, first_name, last_name, created_at").order("created_at").range(from, to)
    ),
  ]);

  const peopleById = new Map(people.map((person) => [person.id, person]));
  const imagesById = new Map(images.map((image) => [image.id, image]));

  // Totals
  const upvotes = votes.filter((vote) => vote.vote === 1).length;
  const downvotes = votes.length - upvotes;
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY).toISOString();
  const votesThisWeek = votes.filter((vote) => vote.created_at >= weekAgo).length;
  const votesLastWeek = votes.filter((vote) => vote.created_at >= twoWeeksAgo && vote.created_at < weekAgo).length;

  // Trends
  const days = lastDays(TREND_DAYS);
  const captionTrend = byDay(captions.map((caption) => caption.created_at), days);
  const voteTrend = byDay(votes.map((vote) => vote.created_at), days);

  // When does the community vote? weekday x hour, New York time
  const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  votes.forEach((vote) => {
    const { weekday, hour } = toWeekdayHour(vote.created_at);
    heatmap[weekday][hour] += 1;
  });

  // Vibes
  const vibes: VibeStat[] = VIBES.map(({ id }) => {
    const list = captions.filter((caption) => caption.vibe === id);
    const up = list.reduce((sum, caption) => sum + (caption.upvotes ?? 0), 0);
    const down = list.reduce((sum, caption) => sum + (caption.downvotes ?? 0), 0);

    return {
      vibe: id,
      captions: list.length,
      upvotes: up,
      downvotes: down,
      approval: up + down > 0 ? up / (up + down) : null,
    };
  });

  // Neighborhoods: which places make people laugh?
  const upvotesByImage = new Map<number, number>();
  captions.forEach((caption) =>
    upvotesByImage.set(caption.image_id, (upvotesByImage.get(caption.image_id) ?? 0) + (caption.upvotes ?? 0))
  );

  const placeMap = new Map<string, { photos: number; upvotes: number }>();
  images.forEach((image) => {
    const place = placeName(image.neighborhood);
    const entry = placeMap.get(place) ?? { photos: 0, upvotes: 0 };
    entry.photos += 1;
    entry.upvotes += upvotesByImage.get(image.id) ?? 0;
    placeMap.set(place, entry);
  });

  const places: PlaceStat[] = [...placeMap.entries()]
    .map(([place, { photos, upvotes }]) => ({ place, photos, upvotes, perPhoto: upvotes / photos }))
    .sort((a, b) => b.photos - a.photos || b.upvotes - a.upvotes)
    .slice(0, 8);

  // AI generation health
  const succeeded = requests.filter((request) => request.status === "success").length;
  const durations = requests
    .filter((request) => request.status === "success" && request.duration_ms !== null)
    .map((request) => request.duration_ms!)
    .sort((a, b) => a - b);

  const models = new Map<string, number>();
  requests.forEach((request) => {
    const model = request.model ?? "unknown";
    models.set(model, (models.get(model) ?? 0) + 1);
  });

  // Captions worth a look
  const withImage = (caption: Caption): FeaturedCaption => ({
    ...caption,
    image: imagesById.get(caption.image_id) ?? null,
  });

  const funniest = [...captions].sort((a, b) => b.score - a.score || b.upvotes - a.upvotes)[0];

  // Most divisive: lots of votes, split close to 50/50.
  const divisive = captions
    .filter((caption) => caption.upvotes > 0 && caption.downvotes > 0 && caption.upvotes + caption.downvotes >= 3)
    .sort((a, b) => {
      const balance = (c: Caption) => Math.min(c.upvotes, c.downvotes) / Math.max(c.upvotes, c.downvotes);
      return balance(b) - balance(a) || b.upvotes + b.downvotes - (a.upvotes + a.downvotes);
    })[0];

  const unseen = captions.filter((caption) => caption.upvotes + caption.downvotes === 0).length;

  return {
    totals: {
      users: people.length,
      photos: images.length,
      captions: captions.length,
      votes: votes.length,
      upvotes,
      downvotes,
      approval: votes.length > 0 ? upvotes / votes.length : null,
      votesThisWeek,
      votesLastWeek,
      newUsersThisWeek: people.filter((person) => person.created_at >= weekAgo).length,
      captionsPerPhoto: images.length > 0 ? captions.length / images.length : 0,
      unseenShare: captions.length > 0 ? unseen / captions.length : null,
    },
    captionTrend,
    voteTrend,
    heatmap,
    vibes,
    places,
    generation: {
      requests: requests.length,
      successRate: requests.length > 0 ? succeeded / requests.length : null,
      failures: requests.length - succeeded,
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      models: [...models.entries()].sort((a, b) => b[1] - a[1]),
    },
    funniest: funniest && funniest.score > 0 ? withImage(funniest) : null,
    divisive: divisive ? withImage(divisive) : null,
    topVoters: leaders(votes.map((vote) => vote.user_id), peopleById),
    topPosters: leaders(images.map((image) => image.created_by), peopleById),
  };
}
