import "server-only";
import { getDb } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/data";
import type { Profile } from "@/lib/types";

export interface PromptChain {
  id: number;
  name: string;
  vibe: string | null;
  description: string | null;
  created_at: string;
  steps: PromptChainStep[];
  mix: { weight: number; is_active: boolean; updated_at: string } | null;
}

export interface PromptChainStep {
  id: number;
  chain_id: number;
  step_order: number;
  name: string;
  output_key: string | null;
  instructions: string;
}

export async function getPromptChains(): Promise<PromptChain[]> {
  const { db } = await getDb();

  const { data, error } = await db
    .from("prompt_chains")
    .select(
      "id, name, vibe, description, created_at, steps:prompt_chain_steps(id, chain_id, step_order, name, output_key, instructions), mix:prompt_chain_mix(weight, is_active, updated_at)"
    )
    .order("id");

  if (error) {
    throw new Error(`${error.message}. Did you run the Week 7 migration?`);
  }

  return ((data ?? []) as unknown as (Omit<PromptChain, "mix"> & { mix: PromptChain["mix"] | PromptChain["mix"][] })[]).map(
    (chain) => ({
      ...chain,
      steps: [...chain.steps].sort((a, b) => a.step_order - b.step_order),
      // One-to-one embeds come back as an object; normalise in case it's an array.
      mix: Array.isArray(chain.mix) ? chain.mix[0] ?? null : chain.mix,
    })
  );
}

export async function getPromptChain(id: number): Promise<PromptChain | null> {
  return (await getPromptChains()).find((chain) => chain.id === id) ?? null;
}

export interface GenerationRequest {
  id: number;
  image_id: number;
  vibe: string | null;
  prompt: string | null;
  model: string | null;
  status: string | null;
  description: string | null;
  raw_response: string | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  created_by: string | null;
  image: { image_url: string; neighborhood: string | null } | null;
  captions: { id: number }[];
  requester: Profile | null;
}

export type StatusFilter = "all" | "success" | "failed";

export async function getGenerationRequests({ status, page }: { status: StatusFilter; page: number }) {
  const { db } = await getDb();
  const from = (page - 1) * PAGE_SIZE;

  let request = db
    .from("caption_requests")
    .select(
      "id, image_id, vibe, prompt, model, status, description, raw_response, error, duration_ms, created_at, created_by, image:images(image_url, neighborhood), captions(id)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status === "success") request = request.eq("status", "success");
  if (status === "failed") request = request.neq("status", "success");

  const { data, count, error } = await request.range(from, from + PAGE_SIZE - 1);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as Omit<GenerationRequest, "requester">[];
  const ids = [...new Set(rows.map((row) => row.created_by).filter(Boolean))] as string[];
  const { data: profiles } = ids.length
    ? await db.from("profiles").select("id, first_name, last_name, avatar_url, is_superadmin, created_at").in("id", ids)
    : { data: [] };
  const byId = new Map(((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]));

  return {
    requests: rows.map((row) => ({ ...row, requester: row.created_by ? byId.get(row.created_by) ?? null : null })),
    total: count ?? 0,
  };
}
