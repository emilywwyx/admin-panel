import Link from "next/link";
import { Suspense } from "react";
import { SubmitButton } from "@/components/buttons";
import { Card, Flash, PageHeader, inputClass } from "@/components/ui";
import { param, type SearchParams } from "@/lib/params";
import { createImage } from "../actions";
import { Field, VibeSelect } from "../fields";

export default function NewMediaPage({ searchParams }: PageProps<"/media/new">) {
  return (
    <>
      <PageHeader
        title="New photo"
        description="Upload a photo (or link one). You can add captions to it on the next screen."
        actions={
          <Link href="/media" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← Back to media
          </Link>
        }
      />
      <Suspense>
        <Messages searchParams={searchParams} />
      </Suspense>
      <Card className="max-w-xl">
        <form action={createImage} className="space-y-5">
          <Field label="Photo (JPG, PNG, or WebP, up to 4MB)">
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-100"
            />
          </Field>
          <Field label="…or an image URL">
            <input type="url" name="image_url" placeholder="https://" className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Neighborhood">
              <input name="neighborhood" maxLength={40} placeholder="Morningside Heights" className={inputClass} />
            </Field>
            <Field label="Vibe">
              <VibeSelect />
            </Field>
          </div>
          <SubmitButton>Create photo</SubmitButton>
        </form>
      </Card>
    </>
  );
}

async function Messages({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return <Flash error={param(params, "error")} />;
}
