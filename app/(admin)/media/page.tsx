import Link from "next/link";
import { Suspense } from "react";
import { Empty, FilterLink, Flash, PageHeader, Pagination, Thumb, VibeTag, inputClass, buttonClass } from "@/components/ui";
import { PAGE_SIZE, getMediaList } from "@/lib/data";
import { formatDate, fullName } from "@/lib/format";
import { pageParam, param, withParams, type SearchParams } from "@/lib/params";
import { VIBES, isVibe, placeName } from "@/lib/vibes";

export default function MediaPage({ searchParams }: PageProps<"/media">) {
  return (
    <>
      <PageHeader
        title="Media"
        description="Photos and the AI captions generated for them. Open one to edit or delete it."
        actions={
          <Link href="/media/new" className={buttonClass.primary}>
            New photo
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-muted">Loading media…</p>}>
        <MediaGrid searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MediaGrid({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = param(params, "q");
  const vibeParam = param(params, "vibe");
  const vibe = isVibe(vibeParam) ? vibeParam : null;
  const page = pageParam(params);

  const { items, total } = await getMediaList({ query, vibe, page });
  const href = (values: Record<string, string | number | null>) =>
    withParams("/media", { q: query, vibe, page, ...values });

  return (
    <>
      <Flash notice={param(params, "notice")} error={param(params, "error")} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form className="flex min-w-64 flex-1" action="/media">
          {vibe && <input type="hidden" name="vibe" value={vibe} />}
          <input name="q" defaultValue={query} placeholder="Search by neighborhood" className={inputClass} />
        </form>
        <FilterLink href={href({ vibe: null, page: 1 })} active={!vibe}>
          All vibes
        </FilterLink>
        {VIBES.map((option) => (
          <FilterLink key={option.id} href={href({ vibe: option.id, page: 1 })} active={vibe === option.id}>
            {option.label}
          </FilterLink>
        ))}
      </div>

      {items.length === 0 ? (
        <Empty>No photos match.</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => {
            const best = item.captions[0];

            return (
              <li key={item.id}>
                <Link
                  href={`/media/${item.id}`}
                  className="group block overflow-hidden rounded-[28px] border border-line-soft bg-surface transition duration-200 hover:-translate-y-1 hover:border-line hover:shadow-lift"
                >
                  <Thumb src={item.image_url} alt={placeName(item.neighborhood)} className="aspect-[4/3] w-full transition-transform duration-[450ms] group-hover:scale-[1.04]" />
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink">{placeName(item.neighborhood)}</p>
                      <VibeTag vibe={item.vibe} />
                    </div>
                    <p className="line-clamp-2 min-h-10 text-sm text-muted">
                      {best ? `“${best.content}”` : "No captions yet."}
                    </p>
                    <p className="flex justify-between text-xs text-muted">
                      <span>
                        {item.captions.length} captions · by {item.uploader ? fullName(item.uploader) : "unknown"}
                      </span>
                      <span>{formatDate(item.created_at)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} href={(next) => href({ page: next })} />
    </>
  );
}
