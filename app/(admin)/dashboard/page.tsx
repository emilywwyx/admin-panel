import Link from "next/link";
import { Suspense } from "react";
import { BarList, ColumnChart, Heatmap } from "@/components/charts";
import { Card, Delta, Empty, PageHeader, StatTile, Thumb, VibeTag } from "@/components/ui";
import { formatCount, formatDuration, formatPercent, fullName } from "@/lib/format";
import { getDashboard, type FeaturedCaption, type Leader } from "@/lib/stats";
import { placeName } from "@/lib/vibes";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="What the community is captioning, voting on, and laughing at." />
      <Suspense fallback={<p className="text-sm text-muted">Crunching the numbers…</p>}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const stats = await getDashboard();
  const { totals, generation } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Users"
          value={formatCount(totals.users)}
          detail={`${totals.newUsersThisWeek} joined in the last 7 days`}
        />
        <StatTile
          label="Photos"
          value={formatCount(totals.photos)}
          detail={`${totals.captionsPerPhoto.toFixed(1)} AI captions per photo`}
        />
        <StatTile
          label="Votes"
          value={formatCount(totals.votes)}
          detail={<Delta current={totals.votesThisWeek} previous={totals.votesLastWeek} label="vs. the week before" />}
        />
        <StatTile
          label="Crowd approval"
          value={formatPercent(totals.approval)}
          detail={`${formatCount(totals.upvotes)} up · ${formatCount(totals.downvotes)} down`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="AI captions generated per day" description="Last 30 days">
          <div className="pl-6">
            <ColumnChart data={stats.captionTrend} unit="captions" />
          </div>
        </Card>
        <Card title="Votes cast per day" description="Last 30 days">
          <div className="pl-6">
            <ColumnChart data={stats.voteTrend} unit="votes" />
          </div>
        </Card>
      </div>

      <Card title="When does the crowd vote?" description="Every vote ever cast, by weekday and hour">
        <Heatmap grid={stats.heatmap} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Which vibe lands?" description="Share of votes on each vibe’s captions that were upvotes">
          {stats.vibes.every((vibe) => vibe.captions === 0) ? (
            <Empty>No captions yet.</Empty>
          ) : (
            <BarList
              rows={stats.vibes.map((vibe) => ({
                key: vibe.vibe,
                label: (
                  <span className="inline-flex items-center gap-2">
                    <VibeTag vibe={vibe.vibe} />
                    <span className="text-xs text-muted">{vibe.captions} captions</span>
                  </span>
                ),
                value: vibe.approval ?? 0,
                display: formatPercent(vibe.approval),
                hint: `${vibe.upvotes} up · ${vibe.downvotes} down`,
              }))}
            />
          )}
        </Card>

        <Card title="Funniest neighborhoods" description="Most-photographed places, by upvotes per photo">
          {stats.places.length === 0 ? (
            <Empty>No photos yet.</Empty>
          ) : (
            <BarList
              rows={stats.places.map((place) => ({
                key: place.place,
                label: (
                  <span>
                    {place.place} <span className="text-xs text-muted">{place.photos} photos</span>
                  </span>
                ),
                value: place.perPhoto,
                display: place.perPhoto.toFixed(1),
              }))}
            />
          )}
        </Card>

        <Card title="AI generation health" description={`${formatCount(generation.requests)} Gemini requests`}>
          <dl className="grid grid-cols-2 gap-4">
            <Metric label="Success rate" value={formatPercent(generation.successRate)} />
            <Metric label="Failed requests" value={formatCount(generation.failures)} />
            <Metric label="Median latency" value={formatDuration(generation.p50)} />
            <Metric label="p95 latency" value={formatDuration(generation.p95)} />
          </dl>
          {generation.models.length > 0 && (
            <ul className="mt-5 space-y-1 border-t border-line-soft pt-4 text-xs text-muted">
              {generation.models.map(([model, count]) => (
                <li key={model} className="flex justify-between gap-2">
                  <span className="truncate font-mono">{model}</span>
                  <span className="tabular-nums">{formatCount(count)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">
            {formatPercent(stats.totals.unseenShare)} of captions have never received a vote.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Spotlight title="Funniest caption of all time" caption={stats.funniest} />
        <Spotlight title="Most divisive caption" caption={stats.divisive} note="The closest to a 50/50 split between upvotes and downvotes" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeaderCard title="Most active voters" leaders={stats.topVoters} unit="votes" />
        <LeaderCard title="Top photographers" leaders={stats.topPosters} unit="photos" />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function Spotlight({ title, caption, note }: { title: string; caption: FeaturedCaption | null; note?: string }) {
  return (
    <Card title={title} description={note}>
      {caption ? (
        <Link href={`/media/${caption.image_id}`} className="group flex gap-4 rounded-[20px] p-2 -m-2 transition duration-200 hover:translate-x-1 hover:bg-cream/70">
          <span className="size-28 shrink-0 overflow-hidden rounded-[14px]">
            <Thumb src={caption.image?.image_url} alt="" className="size-full transition-transform duration-[450ms] group-hover:scale-[1.08]" />
          </span>
          <div className="min-w-0 py-1">
            <p className="text-base text-ink">“{caption.content}”</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <VibeTag vibe={caption.vibe} />
              <span>{placeName(caption.image?.neighborhood)}</span>
              <span>
                ▲ {caption.upvotes} · ▼ {caption.downvotes}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <Empty>Not enough votes yet.</Empty>
      )}
    </Card>
  );
}

function LeaderCard({ title, leaders, unit }: { title: string; leaders: Leader[]; unit: string }) {
  return (
    <Card title={title}>
      {leaders.length === 0 ? (
        <Empty>Nobody yet.</Empty>
      ) : (
        <BarList
          rows={leaders.map((leader, index) => ({
            key: leader.id,
            label: (
              <span>
                <span className="mr-2 text-muted">{index + 1}</span>
                {fullName(leader.person)}
              </span>
            ),
            value: leader.value,
            display: `${formatCount(leader.value)} ${unit}`,
          }))}
        />
      )}
    </Card>
  );
}
