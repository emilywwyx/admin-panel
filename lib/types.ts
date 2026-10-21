export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_superadmin: boolean | null;
  created_at: string;
}

export interface ImageRow {
  id: number;
  image_url: string;
  storage_path: string | null;
  neighborhood: string | null;
  vibe: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CaptionRow {
  id: number;
  image_id: number;
  request_id: number | null;
  content: string;
  vibe: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
}

export interface VoteRow {
  id: number;
  caption_id: number;
  user_id: string;
  vote: 1 | -1;
  created_at: string;
}

export interface RequestRow {
  id: number;
  image_id: number;
  vibe: string | null;
  model: string | null;
  status: string | null;
  duration_ms: number | null;
  created_at: string;
  created_by: string | null;
}

export const PROFILE_COLUMNS = "id, first_name, last_name, avatar_url, is_superadmin, created_at";
export const IMAGE_COLUMNS = "id, image_url, storage_path, neighborhood, vibe, created_at, created_by";
export const CAPTION_COLUMNS =
  "id, image_id, request_id, content, vibe, upvotes, downvotes, score, created_at";
export const REQUEST_COLUMNS = "id, image_id, vibe, model, status, duration_ms, created_at, created_by";
