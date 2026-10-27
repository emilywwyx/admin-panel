import Link from "next/link";
import { Suspense } from "react";
import { SubmitButton } from "@/components/buttons";
import { BarList } from "@/components/charts";
import { Card, Empty, Flash, PageHeader, VibeTag, inputClass } from "@/components/ui";
import { formatDateTime, formatPercent } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { getPromptChains } from "@/lib/pipeline";
import { vibeInfo } from "@/lib/vibes";
import { updateMix } from "../actions";

export default function MixPage({ searchParams }: PageProps<"/prompt-chains/mix">) {
  return (
    <>
      <PageHeader
        title="Prompt chain mix"
        description="How often each chain is picked when the app chooses one at random. Share = weight ÷ total weight of active chains."
        actions={
          <Link href="/prompt-chains" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← All chains
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading mix…</p>}>
        <Mix searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Mix({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const chains = await getPromptChains();

  if (chains.length === 0) {
    return <Empty>No prompt chains yet.</Empty>;
  }

  const active = chains.filter((chain) => chain.mix?.is_active);
  const totalWeight = active.reduce((sum, chain) => sum + (chain.mix?.weight ?? 0), 0);
  const share = (chain: (typeof chains)[number]) =>
    chain.mix?.is_active && totalWeight > 0 ? chain.mix.weight / totalWeight : 0;

  return (
    <div className="space-y-6">
      <Flash notice={param(params, "notice")} error={param(params, "error")} />

      <Card title="Current share">
        <BarList
          rows={chains.map((chain) => ({
            key: String(chain.id),
            label: chain.name,
            value: share(chain),
            display: chain.mix?.is_active ? formatPercent(share(chain)) : "Off",
            color: vibeInfo(chain.vibe)?.color,
          }))}
        />
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-zinc-900 text-xs text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Chain</th>
              <th className="px-4 py-3 font-medium">Weight</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {chains.map((chain) => {
              const formId = `mix-${chain.id}`;

              return (
                <tr key={chain.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-zinc-100">{chain.name}</span>
                      <VibeTag vibe={chain.vibe} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={formId}
                      name="weight"
                      type="number"
                      min={0}
                      max={1000}
                      step={1}
                      required
                      defaultValue={chain.mix?.weight ?? 0}
                      aria-label={`${chain.name} weight`}
                      className={`${inputClass} w-24`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={formId}
                      name="is_active"
                      type="checkbox"
                      defaultChecked={chain.mix?.is_active ?? false}
                      aria-label={`${chain.name} active`}
                      className="size-4 accent-zinc-100"
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{chain.mix ? formatDateTime(chain.mix.updated_at) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form id={formId} action={updateMix}>
                      <input type="hidden" name="chain_id" value={chain.id} />
                      <SubmitButton variant="secondary">Save</SubmitButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
