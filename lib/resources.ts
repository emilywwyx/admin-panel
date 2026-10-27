import { VIBES } from "@/lib/vibes";

// Tables managed through the generic create/read/update/delete screens.
// Server actions only ever touch the tables and columns listed here.

export type FieldType = "text" | "textarea" | "number" | "checkbox" | "select" | "email" | "url";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  lowercase?: boolean;
  step?: string;
  defaultValue?: string;
  // Static choices, or rows from another table (value = id).
  options?: { value: string; label: string }[];
  optionsFrom?: { table: string; label: string };
  // Hide long fields from the list table; they still show in the form.
  hideInTable?: boolean;
}

export interface Resource {
  table: string;
  path: string;
  title: string;
  singular: string;
  description: string;
  orderBy: { column: string; ascending: boolean };
  fields: Field[];
}

const vibeOptions = VIBES.map((vibe) => ({ value: vibe.id, label: vibe.label }));

export const RESOURCES = {
  terms: {
    table: "terms",
    path: "/terms",
    title: "Terms",
    singular: "term",
    description: "NYC and Columbia references the caption model can draw on.",
    orderBy: { column: "term", ascending: true },
    fields: [
      { name: "term", label: "Term", type: "text", required: true, placeholder: "Butler" },
      { name: "definition", label: "Definition", type: "textarea", required: true },
      { name: "category", label: "Category", type: "text", placeholder: "Columbia" },
    ],
  },
  examples: {
    table: "generation_examples",
    path: "/examples",
    title: "Generation examples",
    singular: "example",
    description: "Few-shot examples: a photo description and a caption that worked for it.",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "vibe", label: "Vibe", type: "select", options: vibeOptions },
      { name: "scene", label: "Photo description", type: "textarea", required: true },
      { name: "caption", label: "Caption", type: "textarea", required: true },
      { name: "notes", label: "Notes", type: "textarea", hideInTable: true },
    ],
  },
  providers: {
    table: "llm_providers",
    path: "/llm-providers",
    title: "LLM providers",
    singular: "provider",
    description: "Companies whose models generate captions. API keys live in environment variables, never here.",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Google Gemini" },
      { name: "base_url", label: "Base URL", type: "url", placeholder: "https://" },
      { name: "api_key_env", label: "API key env var", type: "text", placeholder: "GEMINI_API_KEY" },
    ],
  },
  models: {
    table: "llm_models",
    path: "/llm-models",
    title: "LLM models",
    singular: "model",
    description: "Models the app can call. Lower priority runs first; the app falls back down the list.",
    orderBy: { column: "priority", ascending: true },
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Gemini 3.5 Flash" },
      { name: "model_key", label: "Model ID", type: "text", required: true, placeholder: "gemini-3.5-flash" },
      { name: "provider_id", label: "Provider", type: "select", required: true, optionsFrom: { table: "llm_providers", label: "name" } },
      { name: "temperature", label: "Temperature", type: "number", required: true, step: "0.1", defaultValue: "1.0" },
      { name: "priority", label: "Priority", type: "number", required: true, defaultValue: "0" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  domains: {
    table: "allowed_signup_domains",
    path: "/signup-domains",
    title: "Allowed signup domains",
    singular: "domain",
    description: "Email domains that may create an account.",
    orderBy: { column: "domain", ascending: true },
    fields: [{ name: "domain", label: "Domain", type: "text", required: true, lowercase: true, placeholder: "columbia.edu" }],
  },
  emails: {
    table: "whitelisted_email_addresses",
    path: "/whitelisted-emails",
    title: "Whitelisted emails",
    singular: "email",
    description: "Individual addresses allowed in even when their domain isn’t.",
    orderBy: { column: "email", ascending: true },
    fields: [
      { name: "email", label: "Email", type: "email", required: true, lowercase: true, placeholder: "someone@gmail.com" },
      { name: "note", label: "Note", type: "text", placeholder: "Guest judge" },
    ],
  },
} satisfies Record<string, Resource>;

export type ResourceKey = keyof typeof RESOURCES;

export function getResource(key: string): Resource | null {
  return key in RESOURCES ? RESOURCES[key as ResourceKey] : null;
}
