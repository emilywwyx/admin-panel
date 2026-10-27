import Link from "next/link";
import { Suspense } from "react";
import { Empty, FilterLink, PageHeader, Pagination, Thumb, VibeTag } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/data";
import { formatDateTime, formatDuration, fullName } from "@/lib/format";
import { pageParam, param, withParams, type SearchParams } from "@/lib/params";
import { getGenerationRequests, type StatusFilter } from "@/lib/pipeline";
import { placeName } from "@/lib/vibes";

export default function GenerationRequestsPage({ searchParams }: PageProps<"/generation-requests">) {
  return (
    <>
      <PageHeader title="Generation requests" description="Every time someone asked the model for captions. Read-only." />
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading requests…</p>}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function statusFilter(params: SearchParams): StatusFilter {
  const value = param(params, "status");
  return value === "success" || value === "failed" ? value : "all";
}

async function Requests({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const status = statusFilter(params);
  const page = pageParam(params);
  const { requests, total } = await getGenerationRequests({ status, page });
  const href = (values: Record<string, string | number | null>) =>
    withParams("/generation-requests", { status: status === "all" ? null : status, page, ...values });

  return (
    <>
      <div className="mb-4 flex gap-2">
        <FilterLink href={href({ status: null, page: 1 })} active={status === "all"}>All</FilterLink>
        <FilterLink href={href({ status: "success", page: 1 })} active={status === "success"}>Succeeded</FilterLink>
        <FilterLink href={href({ status: "failed", page: 1 })} active={status === "failed"}>Failed</FilterLink>
      </div>

      {requests.length === 0 ? (
        <Empty>No requests yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Requested by</th>
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Vibe</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Captions</th>
                <th className="px-4 py-3 text-right font-medium">Latency</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-zinc-900/60">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{request.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatDateTime(request.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-200">{fullName(request.requester)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/media/${request.image_id}`} className="flex items-center gap-2 hover:text-zinc-50">
                      <Thumb src={request.image?.image_url} alt="" className="size-8 shrink-0 rounded-md" />
                      <span className="truncate text-zinc-300">{placeName(request.image?.neighborhood)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><VibeTag vibe={request.vibe} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{request.model ?? "—"}</td>
                  <td className={`whitespace-nowrap px-4 py-3 ${request.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {request.status === "success" ? "✓ Success" : "✕ Failed"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{request.captions.length}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{formatDuration(request.duration_ms)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/llm-responses#request-${request.id}`} className="text-xs text-zinc-400 hover:text-zinc-100">
                      Response →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} href={(next) => href({ page: next })} />
    </>
  );
}
