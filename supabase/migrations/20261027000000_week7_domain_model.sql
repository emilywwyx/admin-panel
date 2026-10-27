-- Week 7: domain model for the caption pipeline.
-- Run once in the Supabase SQL Editor. Safe to re-run: tables use IF NOT EXISTS
-- and seed rows use ON CONFLICT DO NOTHING.

-- ---------- Helpers ----------

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_superadmin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------- LLM providers & models ----------

create table if not exists public.llm_providers (
  id bigint generated always as identity primary key,
  name text not null unique,
  base_url text,
  -- Name of the environment variable that holds the key. Never the key itself.
  api_key_env text,
  created_at timestamptz not null default now()
);

create table if not exists public.llm_models (
  id bigint generated always as identity primary key,
  provider_id bigint not null references public.llm_providers (id) on delete restrict,
  name text not null,
  model_key text not null unique,
  temperature numeric(3, 2) not null default 1.0 check (temperature between 0 and 2),
  -- Lower runs first; the app falls back down the list when a model fails.
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Prompt chains ----------

create table if not exists public.prompt_chains (
  id bigint generated always as identity primary key,
  name text not null unique,
  vibe text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id bigint generated always as identity primary key,
  chain_id bigint not null references public.prompt_chains (id) on delete cascade,
  step_order integer not null,
  name text not null,
  -- The JSON key this step's output is returned under.
  output_key text,
  instructions text not null,
  created_at timestamptz not null default now(),
  unique (chain_id, step_order)
);

-- How often each chain is picked when the app chooses one at random.
create table if not exists public.prompt_chain_mix (
  chain_id bigint primary key references public.prompt_chains (id) on delete cascade,
  weight integer not null default 1 check (weight >= 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- Prompt context ----------

-- Glossary of NYC and Columbia references the model may use.
create table if not exists public.terms (
  id bigint generated always as identity primary key,
  term text not null unique,
  definition text not null,
  category text,
  created_at timestamptz not null default now()
);

-- Few-shot examples: a photo description and a caption that worked for it.
create table if not exists public.generation_examples (
  id bigint generated always as identity primary key,
  vibe text,
  scene text not null,
  caption text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- Access control ----------

create table if not exists public.allowed_signup_domains (
  id bigint generated always as identity primary key,
  domain text not null unique check (domain = lower(domain)),
  created_at timestamptz not null default now()
);

create table if not exists public.whitelisted_email_addresses (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email)),
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security: superadmins only ----------

do $$
declare
  t text;
begin
  foreach t in array array[
    'llm_providers', 'llm_models', 'prompt_chains', 'prompt_chain_steps',
    'prompt_chain_mix', 'terms', 'generation_examples',
    'allowed_signup_domains', 'whitelisted_email_addresses'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Superadmins manage %s" on public.%I', t, t);
    execute format(
      'create policy "Superadmins manage %s" on public.%I for all to authenticated
         using (public.is_superadmin()) with check (public.is_superadmin())',
      t, t
    );
  end loop;
end $$;

-- ---------- Seed data (mirrors genai-hello's current prompt and models) ----------

insert into public.llm_providers (name, base_url, api_key_env)
values ('Google Gemini', 'https://generativelanguage.googleapis.com/v1beta', 'GEMINI_API_KEY')
on conflict (name) do nothing;

insert into public.llm_models (provider_id, name, model_key, temperature, priority)
select p.id, m.name, m.model_key, 1.0, m.priority
from public.llm_providers p
cross join (values
  ('Gemini 3.5 Flash', 'gemini-3.5-flash', 0),
  ('Gemini 3.5 Flash Lite', 'gemini-3.5-flash-lite', 1),
  ('Gemini 3.1 Flash Lite', 'gemini-3.1-flash-lite', 2)
) as m (name, model_key, priority)
where p.name = 'Google Gemini'
on conflict (model_key) do nothing;

insert into public.prompt_chains (name, vibe, description)
values
  ('Funny', 'funny', 'Go for the sharpest, most unexpected joke.'),
  ('Relatable', 'relatable', 'Turn the photo into an everyday struggle the reader recognizes.'),
  ('Deadpan', 'deadpan', 'Something absurd, said in a completely flat voice.'),
  ('Columbia', 'columbia', 'Tie the joke to everyday Columbia student life.')
on conflict (name) do nothing;

insert into public.prompt_chain_steps (chain_id, step_order, name, output_key, instructions)
select c.id, s.step_order, s.name, s.output_key,
  case when s.step_order = 2 then s.instructions || E'\nTone: ' || t.tone else s.instructions end
from public.prompt_chains c
join (values
  ('funny', 'Funny. Go for the sharpest, most unexpected joke.'),
  ('relatable', 'Relatable. Turn the photo into an everyday struggle the reader recognizes from their own life (classes, rent, group chats, being tired, being broke).'),
  ('deadpan', 'Deadpan. Say something absurd about the photo in a completely flat, matter-of-fact voice.'),
  ('columbia', 'Columbia insider. Tie the joke to everyday Columbia student life, only where it fits what is in the photo. Never use the same kind of reference twice in one set.')
) as t (vibe, tone) on t.vibe = c.vibe
cross join (values
  (1, 'Describe', 'description', 'In one or two plain sentences, say what is actually in the photo, including any text that appears in it.'),
  (2, 'Draft', 'drafts', 'Write 8 caption drafts. A good caption is a joke, not a description. It picks one specific thing visible in the photo and gives it an unexpected meaning: misread what is happening on purpose, exaggerate the stakes, give the people or objects a secret motive, or compare it to an everyday New York struggle.'),
  (3, 'Pick', 'captions', 'Pick the 3 funniest drafts. They must use different angles. At most 14 words each. No hashtags, no emojis, no quotation marks.')
) as s (step_order, name, output_key, instructions)
on conflict (chain_id, step_order) do nothing;

insert into public.prompt_chain_mix (chain_id, weight)
select id, 1 from public.prompt_chains
on conflict (chain_id) do nothing;

insert into public.terms (term, definition, category)
values
  ('Butler', 'Butler Library, where all-nighters happen.', 'Columbia'),
  ('Mudd', 'The engineering building, home of late-night labs.', 'Columbia'),
  ('Ferris', 'Ferris Booth Commons, a dining hall in Lerner.', 'Columbia'),
  ('JJ''s', 'JJ''s Place, the late-night dining hall.', 'Columbia'),
  ('The 1 train', 'The subway line that stops at 116th St–Columbia University.', 'NYC'),
  ('Bodega', 'A corner store, usually with a cat.', 'NYC'),
  ('Lit Hum', 'Literature Humanities, part of the Core Curriculum.', 'Columbia')
on conflict (term) do nothing;

insert into public.generation_examples (vibe, scene, caption)
select * from (values
  ('relatable', 'A packed subway car at rush hour.', 'me fitting my entire personality into 4 inches of standing room'),
  ('deadpan', 'A pigeon standing on a park bench.', 'he has been waiting for his lawyer since 9am'),
  ('columbia', 'Students asleep at library tables.', 'butler at 3am is just a very quiet hostage situation')
) as e (vibe, scene, caption)
where not exists (select 1 from public.generation_examples);

insert into public.allowed_signup_domains (domain)
values ('columbia.edu'), ('barnard.edu')
on conflict (domain) do nothing;
