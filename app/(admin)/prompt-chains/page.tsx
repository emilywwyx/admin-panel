import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, PageHeader, VibeTag, buttonClass } from "@/components/ui";
import { getPromptChains } from "@/lib/pipeline";

export default function PromptChainsPage() {
  return (
    <>
      <PageHeader
        title="Prompt chains"
        description="Each chain is the sequence of steps the model follows to caption a photo. Read-only."
        actions={
          <Link href="/prompt-chains/mix" className={buttonClass.secondary}>
            Edit chain mix
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-muted">Loading prompt chains…</p>}>
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
        <Link key={chain.id} href={`/prompt-chains/${chain.id}`} className="group block rounded-[28px] transition duration-200 hover:-translate-y-1 hover:shadow-lift">
          <Card className="transition-colors duration-200 group-hover:border-line">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">{chain.name}</h2>
              <VibeTag vibe={chain.vibe} />
            </div>
            {chain.description && <p className="mt-2 text-sm text-muted">{chain.description}</p>}
            <ol className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink">
              {chain.steps.map((step, index) => (
                <li key={step.id} className="flex items-center gap-2">
                  {index > 0 && <span className="text-muted">→</span>}
                  <span className="rounded-full border border-line px-2 py-0.5">
                    {step.step_order}. {step.name}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted">
              {chain.steps.length} steps ·{" "}
              {chain.mix ? `mix weight ${chain.mix.weight}${chain.mix.is_active ? "" : " (off)"}` : "not in the mix"}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
