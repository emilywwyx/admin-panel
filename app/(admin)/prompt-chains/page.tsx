import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, PageHeader, VibeTag } from "@/components/ui";
import { getPromptChains } from "@/lib/pipeline";

export default function PromptChainsPage() {
  return (
    <>
      <PageHeader
        title="Prompt chains"
        description="Each chain is the sequence of steps the model follows to caption a photo. Read-only."
        actions={
          <Link href="/prompt-chains/mix" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
            Edit chain mix
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading prompt chains…</p>}>
        <Chains />
      </Suspense>
    </>
  );
}

async function Chains() {
  const chains = await getPromptChains();

  if (chains.length === 0) {
    return <Empty>No prompt chains yet.</Empty>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {chains.map((chain) => (
        <Link key={chain.id} href={`/prompt-chains/${chain.id}`} className="block rounded-2xl hover:ring-1 hover:ring-zinc-600">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-zinc-100">{chain.name}</h2>
              <VibeTag vibe={chain.vibe} />
            </div>
            {chain.description && <p className="mt-2 text-sm text-zinc-400">{chain.description}</p>}
            <ol className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
              {chain.steps.map((step, index) => (
                <li key={step.id} className="flex items-center gap-2">
                  {index > 0 && <span className="text-zinc-600">→</span>}
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5">
                    {step.step_order}. {step.name}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-zinc-500">
              {chain.steps.length} steps ·{" "}
              {chain.mix ? `mix weight ${chain.mix.weight}${chain.mix.is_active ? "" : " (off)"}` : "not in the mix"}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
