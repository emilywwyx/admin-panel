import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SubmitButton } from "@/components/buttons";
import { Card, Empty, Flash, PageHeader, Thumb, VibeTag, inputClass } from "@/components/ui";
import { getMedia } from "@/lib/data";
import { formatDateTime, formatDuration, fullName } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { placeName } from "@/lib/vibes";
import { createCaption, deleteCaption, deleteImage, updateCaption, updateImage } from "../actions";
import { Field, VibeSelect } from "../fields";

export default function MediaDetailPage({ params, searchParams }: PageProps<"/media/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading photo…</p>}>
      <MediaDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function MediaDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const imageId = Number(id);

  if (!Number.isInteger(imageId) || imageId <= 0) {
    notFound();
  }

  const media = await getMedia(imageId);

  if (!media) {
    notFound();
  }

  const { image, uploader, captions, requests } = media;

  return (
    <>
      <PageHeader
        title={placeName(image.neighborhood)}
        description={`Photo #${image.id} · uploaded ${formatDateTime(image.created_at)} by ${uploader ? fullName(uploader) : "unknown"}`}
        actions={
          <Link href="/media" className="text-sm text-muted transition-colors duration-200 hover:text-ink">
            ← Back to media
          </Link>
        }
      />
      <Flash notice={param(query, "notice")} error={param(query, "error")} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card>
            <Thumb src={image.image_url} alt={placeName(image.neighborhood)} className="w-full rounded-[16px]" />
          </Card>

          <Card title="Edit photo">
            <form action={updateImage} className="space-y-4">
              <input type="hidden" name="id" value={image.id} />
              <Field label="Image URL">
                <input name="image_url" type="url" required defaultValue={image.image_url} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Neighborhood">
                  <input name="neighborhood" maxLength={40} defaultValue={image.neighborhood ?? ""} className={inputClass} />
                </Field>
                <Field label="Vibe">
                  <VibeSelect defaultValue={image.vibe} />
                </Field>
              </div>
              <SubmitButton>Save changes</SubmitButton>
            </form>
          </Card>

          <Card title="Danger zone" description="Deletes the photo, all of its captions, their votes, and the generation log.">
            <form action={deleteImage}>
              <input type="hidden" name="id" value={image.id} />
              <SubmitButton variant="danger" confirm={`Delete this photo and its ${captions.length} captions? This can’t be undone.`}>
                Delete photo
              </SubmitButton>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={`Captions (${captions.length})`} description="Sorted by score. Vote counts come from real votes and can’t be edited.">
            {captions.length === 0 ? (
              <Empty>No captions yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {captions.map((caption) => (
                  <li key={caption.id} className="rounded-[20px] border border-line-soft p-4 transition duration-200 hover:border-line hover:shadow-soft">
                    <form action={updateCaption} className="space-y-3">
                      <input type="hidden" name="id" value={caption.id} />
                      <input type="hidden" name="image_id" value={image.id} />
                      <textarea
                        name="content"
                        required
                        maxLength={500}
                        rows={2}
                        defaultValue={caption.content}
                        aria-label="Caption text"
                        className={inputClass}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-36">
                          <VibeSelect defaultValue={caption.vibe} />
                        </div>
                        <span className="text-xs text-muted">
                          ▲ {caption.upvotes} · ▼ {caption.downvotes} · score {caption.score}
                        </span>
                        <span className="text-xs text-muted">
                          {caption.request_id ? "AI generated" : "Added manually"} · {formatDateTime(caption.created_at)}
                        </span>
                        <div className="ml-auto flex gap-2">
                          <SubmitButton variant="secondary">Save</SubmitButton>
                        </div>
                      </div>
                    </form>
                    <form action={deleteCaption} className="mt-2 flex justify-end">
                      <input type="hidden" name="id" value={caption.id} />
                      <input type="hidden" name="image_id" value={image.id} />
                      <SubmitButton variant="danger" confirm="Delete this caption and its votes?">
                        Delete
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Add a caption">
            <form action={createCaption} className="space-y-3">
              <input type="hidden" name="image_id" value={image.id} />
              <textarea name="content" required maxLength={500} rows={2} placeholder="Write a caption…" className={inputClass} />
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <VibeSelect defaultValue={image.vibe} />
                </div>
                <SubmitButton>Add caption</SubmitButton>
              </div>
            </form>
          </Card>

          <Card title="Generation log" description="Every Gemini request made for this photo.">
            {requests.length === 0 ? (
              <Empty>No AI requests recorded.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="pb-2 font-medium">When</th>
                      <th className="pb-2 font-medium">Vibe</th>
                      <th className="pb-2 font-medium">Model</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {requests.map((request) => (
                      <tr key={request.id} className="transition-colors duration-200 hover:bg-cream/60">
                        <td className="py-2 text-muted">{formatDateTime(request.created_at)}</td>
                        <td className="py-2"><VibeTag vibe={request.vibe} /></td>
                        <td className="py-2 font-mono text-xs text-muted">{request.model ?? "—"}</td>
                        <td className={`py-2 ${request.status === "success" ? "text-accent-deep" : "text-danger"}`}>
                          {request.status === "success" ? "✓ Success" : "✕ Failed"}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ink">{formatDuration(request.duration_ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
