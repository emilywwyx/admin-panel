import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card, PageHeader, VibeTag } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { getPromptChain } from "@/lib/pipeline";

export default function PromptChainPage({ params }: PageProps<"/prompt-chains/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading chain…</p>}>
      <Chain params={params} />
    </Suspense>
  );
}

async function Chain({ params }: { params: Promise<{ id: string }> }) {
  const chain = await getPromptChain(Number((await params).id));

  if (!chain) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={chain.name}
        description={chain.description ?? undefined}
        actions={
          <Link href="/prompt-chains" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← All chains
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <VibeTag vibe={chain.vibe} />
        <span>Created {formatDateTime(chain.created_at)}</span>
        <span>·</span>
        <span>{chain.mix ? `Mix weight ${chain.mix.weight}${chain.mix.is_active ? "" : " (off)"}` : "Not in the mix"}</span>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-100">Prompt chain steps</h2>
      <ol className="space-y-4">
        {chain.steps.map((step) => (
          <li key={step.id}>
            <Card>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium text-zinc-100">
                  <span className="mr-2 text-zinc-500">Step {step.step_order}</span>
                  {step.name}
                </h3>
                {step.output_key && (
                  <span className="font-mono text-xs text-zinc-400">→ &quot;{step.output_key}&quot;</span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{step.instructions}</p>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
