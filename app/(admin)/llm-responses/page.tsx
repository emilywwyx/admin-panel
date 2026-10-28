import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, FilterLink, PageHeader, Pagination, Thumb, VibeTag } from "@/components/ui";
import { PAGE_SIZE } from "@/lib/data";
import { formatDateTime, formatDuration } from "@/lib/format";
import { pageParam, param, withParams, type SearchParams } from "@/lib/params";
import { getGenerationRequests, type StatusFilter } from "@/lib/pipeline";
import { placeName } from "@/lib/vibes";

export default function LlmResponsesPage({ searchParams }: PageProps<"/llm-responses">) {
  return (
    <>
      <PageHeader
        title="LLM responses"
        description="What the model actually sent back for each request: the raw JSON, or the error. Read-only."
      />
      <Suspense fallback={<p className="text-sm text-muted">Loading responses…</p>}>
        <Responses searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function pretty(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

async function Responses({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const value = param(params, "status");
  const status: StatusFilter = value === "success" || value === "failed" ? value : "all";
  const page = pageParam(params);
  const { requests, total } = await getGenerationRequests({ status, page });
  const href = (values: Record<string, string | number | null>) =>
    withParams("/llm-responses", { status: status === "all" ? null : status, page, ...values });

  return (
    <>
      <div className="mb-4 flex gap-2">
        <FilterLink href={href({ status: null, page: 1 })} active={status === "all"}>All</FilterLink>
        <FilterLink href={href({ status: "success", page: 1 })} active={status === "success"}>Succeeded</FilterLink>
        <FilterLink href={href({ status: "failed", page: 1 })} active={status === "failed"}>Failed</FilterLink>
      </div>

      {requests.length === 0 ? (
        <Empty>No responses yet.</Empty>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} id={`request-${request.id}`} className="scroll-mt-6">
              <Card>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <Link href={`/media/${request.image_id}`} className="flex items-center gap-2 transition-colors duration-200 hover:text-accent-deep">
                    <Thumb src={request.image?.image_url} alt="" className="size-10 rounded-lg" />
                    <span className="text-sm text-ink">{placeName(request.image?.neighborhood)}</span>
                  </Link>
                  <VibeTag vibe={request.vibe} />
                  <span className="font-mono">{request.model ?? "unknown model"}</span>
                  <span>{formatDuration(request.duration_ms)}</span>
                  <span>{formatDateTime(request.created_at)}</span>
                  <span className={`ml-auto font-medium ${request.status === "success" ? "text-accent-deep" : "text-danger"}`}>
                    Request #{request.id} · {request.status === "success" ? "✓ Success" : "✕ Failed"}
                  </span>
                </div>

                {request.description && (
                  <p className="mt-4 text-sm text-ink">
                    <span className="text-muted">Model saw: </span>
                    {request.description}
                  </p>
                )}

                {request.error && (
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[14px] bg-danger-soft p-4 text-xs text-danger">
                    {request.error}
                  </pre>
                )}

                {request.raw_response && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs text-muted transition-colors duration-200 hover:text-ink">Raw response</summary>
                    <pre className="mt-2 max-h-96 overflow-auto rounded-[14px] bg-cream-2 p-4 text-xs text-ink">
                      {pretty(request.raw_response)}
                    </pre>
                  </details>
                )}

                {request.prompt && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted transition-colors duration-200 hover:text-ink">Prompt sent</summary>
                    <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-[14px] bg-cream-2 p-4 text-xs text-ink">
                      {request.prompt}
                    </pre>
                  </details>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} href={(next) => href({ page: next })} />
    </>
  );
}
