import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, FilterLink, PageHeader, Pagination, StatTile, Thumb, VoteTag } from "@/components/ui";
import { PAGE_SIZE, getCaptionRankings, getVotes, type RankedCaption, type VoteFilter } from "@/lib/data";
import { formatCount, formatDateTime, formatPercent, fullName } from "@/lib/format";
import { pageParam, param, withParams, type SearchParams } from "@/lib/params";
import { placeName } from "@/lib/vibes";

export default function VotesPage({ searchParams }: PageProps<"/votes">) {
  return (
    <>
      <PageHeader title="Votes" description="Every upvote and downvote, plus how captions rank. Read-only." />
      <Suspense fallback={<p className="text-sm text-muted">Loading votes…</p>}>
        <Votes searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Votes({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filterParam = param(params, "vote");
  const filter: VoteFilter = filterParam === "up" || filterParam === "down" ? filterParam : "all";
  const page = pageParam(params);

  const [{ votes, total, up, down }, rankings] = await Promise.all([getVotes({ filter, page }), getCaptionRankings()]);
  const href = (values: Record<string, string | number | null>) =>
    withParams("/votes", { vote: filter === "all" ? null : filter, page, ...values });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Upvotes" value={formatCount(up)} />
        <StatTile label="Downvotes" value={formatCount(down)} />
        <StatTile label="Upvote share" value={formatPercent(up + down > 0 ? up / (up + down) : null)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ranking title="Highest-rated captions" captions={rankings.top} />
        <Ranking title="Lowest-rated captions" captions={rankings.bottom} />
      </div>

      <Card title="Vote log">
        <div className="mb-4 flex gap-2">
          <FilterLink href={href({ vote: null, page: 1 })} active={filter === "all"}>All</FilterLink>
          <FilterLink href={href({ vote: "up", page: 1 })} active={filter === "up"}>Upvotes</FilterLink>
          <FilterLink href={href({ vote: "down", page: 1 })} active={filter === "down"}>Downvotes</FilterLink>
        </div>

        {votes.length === 0 ? (
          <Empty>No votes yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-3 font-medium">When</th>
                  <th className="pb-3 font-medium">Voter</th>
                  <th className="pb-3 font-medium">Vote</th>
                  <th className="pb-3 font-medium">Caption</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {votes.map((vote) => (
                  <tr key={vote.id} className="align-top transition-colors duration-200 hover:bg-cream/60">
                    <td className="whitespace-nowrap py-3 pr-4 text-muted">{formatDateTime(vote.created_at)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-ink">{fullName(vote.voter)}</td>
                    <td className="py-3 pr-4"><VoteTag vote={vote.vote} /></td>
                    <td className="py-3">
                      {vote.caption ? (
                        <Link href={`/media/${vote.caption.image_id}`} className="flex items-center gap-3 transition-colors duration-200 hover:text-accent-deep">
                          <Thumb src={vote.caption.image?.image_url} alt="" className="size-10 shrink-0 rounded-lg" />
                          <span className="line-clamp-2 text-ink">“{vote.caption.content}”</span>
                        </Link>
                      ) : (
                        <span className="text-muted">Deleted caption</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} pageSize={PAGE_SIZE} href={(next) => href({ page: next })} />
      </Card>
    </div>
  );
}

function Ranking({ title, captions }: { title: string; captions: RankedCaption[] }) {
  return (
    <Card title={title}>
      {captions.length === 0 ? (
        <Empty>Not enough votes yet.</Empty>
      ) : (
        <ol className="space-y-3">
          {captions.map((caption, index) => (
            <li key={caption.id}>
              <Link href={`/media/${caption.image_id}`} className="group flex items-center gap-3 rounded-[14px] p-1.5 -m-1.5 transition duration-200 hover:translate-x-1 hover:bg-cream/70">
                <span className="w-4 text-right text-xs text-muted">{index + 1}</span>
                <span className="size-10 shrink-0 overflow-hidden rounded-lg">
                  <Thumb src={caption.image?.image_url} alt="" className="size-full transition-transform duration-[450ms] group-hover:scale-[1.08]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">“{caption.content}”</p>
                  <p className="text-xs text-muted">{placeName(caption.image?.neighborhood)}</p>
                </div>
                <span className="shrink-0 text-right text-xs tabular-nums text-ink">
                  {caption.score > 0 ? "+" : ""}
                  {caption.score}
                  <span className="block text-muted">▲{caption.upvotes} ▼{caption.downvotes}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
