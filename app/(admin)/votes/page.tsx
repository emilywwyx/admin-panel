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
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading votes…</p>}>
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
              <thead className="text-xs text-zinc-400">
                <tr>
                  <th className="pb-3 font-medium">When</th>
                  <th className="pb-3 font-medium">Voter</th>
                  <th className="pb-3 font-medium">Vote</th>
                  <th className="pb-3 font-medium">Caption</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {votes.map((vote) => (
                  <tr key={vote.id} className="align-top">
                    <td className="whitespace-nowrap py-3 pr-4 text-zinc-400">{formatDateTime(vote.created_at)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-zinc-200">{fullName(vote.voter)}</td>
                    <td className="py-3 pr-4"><VoteTag vote={vote.vote} /></td>
                    <td className="py-3">
                      {vote.caption ? (
                        <Link href={`/media/${vote.caption.image_id}`} className="flex items-center gap-3 hover:text-zinc-50">
                          <Thumb src={vote.caption.image?.image_url} alt="" className="size-10 shrink-0 rounded-lg" />
                          <span className="line-clamp-2 text-zinc-300">“{vote.caption.content}”</span>
                        </Link>
                      ) : (
                        <span className="text-zinc-500">Deleted caption</span>
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
              <Link href={`/media/${caption.image_id}`} className="flex items-center gap-3 rounded-lg hover:bg-zinc-800/40">
                <span className="w-4 text-right text-xs text-zinc-500">{index + 1}</span>
                <Thumb src={caption.image?.image_url} alt="" className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">“{caption.content}”</p>
                  <p className="text-xs text-zinc-500">{placeName(caption.image?.neighborhood)}</p>
                </div>
                <span className="shrink-0 text-right text-xs tabular-nums text-zinc-300">
                  {caption.score > 0 ? "+" : ""}
                  {caption.score}
                  <span className="block text-zinc-500">▲{caption.upvotes} ▼{caption.downvotes}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
